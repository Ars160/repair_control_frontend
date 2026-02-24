import axios from 'axios';

// In production: use relative URL so nginx proxies requests to backend
// In local dev: use localhost:8080 directly
const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include the token
// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Helper to resolve photo URL
const resolvePhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return `${API_URL}/files/${path}`;
};

export const apiClient = {
    // Login with email and password
    login: async (phone, password) => {
        try {
            const response = await api.post('/auth/login', { phone, password });
            const token = response.data.token;
            localStorage.setItem('token', token);

            // Fetch user details
            const userResponse = await api.get('/auth/me');
            return { success: true, user: userResponse.data };
        } catch (error) {
            console.error("Login error", error);
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    },

    register: async (userData) => {
        try {
            await api.post('/auth/register', userData);
            return { success: true };
        } catch (error) {
            console.error("Register error", error);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    },

    getMe: async () => {
        try {
            const response = await api.get('/auth/me');
            return { success: true, user: response.data };
        } catch (error) {
            return { success: false };
        }
    },

    getTasks: async (userRole, userId) => {
        try {
            const response = await api.get('/api/tasks');
            // Map backend data to frontend expected structure
            const allTasks = response.data.map(task => {
                const submission = task.report
                    ? {
                        ...task.report,
                        photos: (task.report.photos || []).map(name => `${API_URL}/files/${name}`)
                    }
                    : null;
                return {
                    ...task,
                    finalPhotoUrl: resolvePhotoUrl(task.finalPhotoUrl),
                    object: `${task.objectName} - ${task.subObjectName}`,
                    priority: task.priority || 'MEDIUM', // Use actual priority from backend
                    status: task.status,
                    checklist: (task.checklist || []).map(item => ({
                        ...item,
                        photoUrl: resolvePhotoUrl(item.photoUrl)
                    })),
                    submission
                };
            });

            // Filter based on role (replicating mock logic)
            // AND Filter out DRAFT projects for non-estimatros/admins
            const visibleTasks = allTasks.filter(t =>
                t.projectStatus === 'PUBLISHED' || ['ESTIMATOR', 'SUPER_ADMIN'].includes(userRole)
            );

            switch (userRole) {
                case 'WORKER':
                    return visibleTasks.filter(t =>
                        // Only show tasks specifically assigned to worker
                        (t.assigneeIds && t.assigneeIds.includes(userId)) &&
                        ['ACTIVE', 'REWORK_FOREMAN', 'LOCKED', 'UNDER_REVIEW_FOREMAN', 'UNDER_REVIEW_PM', 'REWORK_PM', 'COMPLETED'].includes(t.status)
                    );
                case 'FOREMAN':
                    return visibleTasks.filter(t =>
                        // Show all tasks in projects where user is assigned as foreman
                        (t.projectForemanIds && t.projectForemanIds.includes(userId))
                    );
                case 'PM':
                    return visibleTasks.filter(t =>
                        // Show tasks in projects where user is the Project Manager
                        t.projectManagerId === userId &&
                        t.status === 'UNDER_REVIEW_PM'
                    );
                case 'ESTIMATOR':
                    return visibleTasks;
                case 'SUPER_ADMIN':
                    return visibleTasks;
                default:
                    return [];
            }
        } catch (error) {
            console.error("Get tasks error", error);
            return [];
        }
    },

    getTaskById: async (taskId) => {
        try {
            const response = await api.get(`/api/tasks/${taskId}`);
            const task = response.data;
            const submission = task.report
                ? {
                    ...task.report,
                    photos: (task.report.photos || []).map(name => `${API_URL}/files/${name}`)
                }
                : null;
            return {
                ...task,
                finalPhotoUrl: resolvePhotoUrl(task.finalPhotoUrl),
                object: `${task.objectName} - ${task.subObjectName}`,
                priority: 'medium',
                checklist: (task.checklist || []).map(item => ({
                    ...item,
                    photoUrl: resolvePhotoUrl(item.photoUrl)
                })),
                submission
            };
        } catch (error) {
            console.error("Get task error", error);
            return null;
        }
    },

    submitTaskReview: async (taskId, data) => {
        try {
            // New workflow submit
            await api.post(`/api/tasks/${taskId}/submit`, data);
            return { success: true };
        } catch (error) {
            console.error("Submit error", error);
            return { success: false, message: error.response?.data?.message || 'Не удалось отправить отчет. Проверьте все пункты чек-листа и фото.' };
        }
    },

    updateTaskStatus: async (taskId, newStatus, comment) => {
        try {
            if (newStatus === 'COMPLETED' || newStatus === 'UNDER_REVIEW_PM') {
                // Determine if it's approve based on status transition, but the endpoint is just /approve
                // The backend handles the state transition logic based on current status and user role
                await api.post(`/api/tasks/${taskId}/approve`, { comment });
            } else if (newStatus === 'REWORK_FOREMAN' || newStatus === 'REWORK_PM') {
                await api.post(`/api/tasks/${taskId}/reject`, { comment: comment || 'Rework needed' });
            } else {
                // For other status updates if any (e.g. locking/unlocking), we might need a general update endpoint
                // But for the review flow, these are the main ones.
                console.warn(`Unsupported status update via client: ${newStatus}`);
                return { success: false, message: 'Unsupported status' };
            }
            return { success: true };
        } catch (error) {
            console.error("Update status error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to update status' };
        }
    },

    // --- Estimator / CRUD Methods ---

    getProjects: async (userRole) => {
        try {
            const response = await api.get('/api/projects');
            // If role is provided, filter drafts
            if (userRole && !['ESTIMATOR', 'SUPER_ADMIN'].includes(userRole)) {
                return response.data.filter(p => p.status === 'PUBLISHED');
            }
            return response.data;
        } catch (error) {
            console.error("Get projects error", error);
            return [];
        }
    },

    createProject: async (data) => {
        try {
            const response = await api.post('/api/projects', data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Create project error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to create project' };
        }
    },

    getObjectsByProject: async (projectId) => {
        try {
            const response = await api.get(`/api/objects/project/${projectId}`);
            return response.data;
        } catch (error) {
            console.error("Get objects error", error);
            return [];
        }
    },

    createObject: async (data) => {
        try {
            const response = await api.post('/api/objects', data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Create object error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to create object' };
        }
    },

    getSubObjectsByObject: async (objectId) => {
        try {
            const response = await api.get(`/api/sub-objects/object/${objectId}`);
            return response.data;
        } catch (error) {
            console.error("Get sub-objects error", error);
            return [];
        }
    },

    createSubObject: async (data) => {
        try {
            const response = await api.post('/api/sub-objects', data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Create sub-object error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to create sub-object' };
        }
    },

    getTasksBySubObject: async (subObjectId, userId = null) => {
        try {
            const url = userId
                ? `/api/tasks/sub-object/${subObjectId}?userId=${userId}`
                : `/api/tasks/sub-object/${subObjectId}`;
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error("Get tasks by sub-object error", error);
            return [];
        }
    },

    createTask: async (data) => {
        try {
            const response = await api.post('/api/tasks', data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Create task error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to create task' };
        }
    },

    updateTask: async (id, data) => {
        try {
            const response = await api.put(`/api/tasks/${id}`, data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update task error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to update task' };
        }
    },

    deleteTask: async (id) => {
        try {
            await api.delete(`/api/tasks/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete task error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete task' };
        }
    },

    updateProject: async (id, data) => {
        try {
            const response = await api.put(`/api/projects/${id}`, data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update project error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to update project' };
        }
    },

    deleteProject: async (id) => {
        try {
            await api.delete(`/api/projects/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete project error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete project' };
        }
    },

    publishProject: async (id) => {
        try {
            await api.post(`/api/projects/${id}/publish`);
            return { success: true };
        } catch (error) {
            console.error("Publish project error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to publish project' };
        }
    },

    updateObject: async (id, data) => {
        try {
            const response = await api.put(`/api/objects/${id}`, data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update object error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to update object' };
        }
    },

    deleteObject: async (id) => {
        try {
            await api.delete(`/api/objects/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete object error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete object' };
        }
    },

    updateSubObject: async (id, data) => {
        try {
            const response = await api.put(`/api/sub-objects/${id}`, data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update sub-object error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to update sub-object' };
        }
    },

    deleteSubObject: async (id) => {
        try {
            await api.delete(`/api/sub-objects/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete sub-object error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete sub-object' };
        }
    },

    getUsers: async () => {
        try {
            const response = await api.get('/api/users');
            return response.data;
        } catch (error) {
            console.error("Get users error", error);
            return [];
        }
    },

    updateUser: async (id, data) => {
        try {
            const response = await api.put(`/api/users/${id}`, data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update user error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to update user' };
        }
    },

    deleteUser: async (id) => {
        try {
            await api.delete(`/api/users/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete user error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete user' };
        }
    },

    // Checklist APIs
    getChecklistsByTask: async (taskId) => {
        try {
            const response = await api.get(`/api/checklist/task/${taskId}`);
            return response.data;
        } catch (error) {
            console.error("Get checklists error", error);
            return [];
        }
    },

    createChecklistItem: async (taskId, description, orderIndex, isPhotoRequired = false, methodology = null) => {
        try {
            const response = await api.post(`/api/checklist/task/${taskId}`, {
                description,
                orderIndex,
                isPhotoRequired,
                methodology
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Create checklist error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    updateChecklistItem: async (id, description, orderIndex, isPhotoRequired) => {
        try {
            const response = await api.put(`/api/checklist/${id}`, {
                description,
                orderIndex,
                isPhotoRequired
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update checklist error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    deleteChecklistItem: async (id) => {
        try {
            await api.delete(`/api/checklist/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete checklist error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    toggleChecklistComplete: async (id, completed) => {
        try {
            const response = await api.put(`/api/checklist/${id}/complete?completed=${completed}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Toggle checklist error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    updateChecklistPhoto: async (id, photoUrl) => {
        try {
            const response = await api.put(`/api/checklist/${id}/photo`, { photoUrl });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update checklist photo error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    updateTaskFinalPhoto: async (taskId, photoUrl) => {
        try {
            const response = await api.put(`/api/tasks/${taskId}/final-photo`, { photoUrl });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update final photo error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    updateChecklistItemRemark: async (id, remark) => {
        try {
            const response = await api.put(`/api/checklist/${id}/remark`, { remark });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update checklist remark error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    // --- Telegram API ---
    getTelegramConfig: async () => {
        try {
            const response = await api.get('/api/telegram/config');
            return response.data;
        } catch (error) {
            console.error("Get telegram config error", error);
            return null;
        }
    },

    // --- Notification APIs ---
    getUnreadNotifications: async () => {
        try {
            const response = await api.get('/api/notifications');
            return response.data;
        } catch (error) {
            console.error("Get notifications error", error);
            return [];
        }
    },

    getAllNotifications: async () => {
        try {
            const response = await api.get('/api/notifications/all');
            return response.data;
        } catch (error) {
            console.error("Get all notifications error", error);
            return [];
        }
    },

    markNotificationAsRead: async (id) => {
        try {
            await api.post(`/api/notifications/${id}/read`);
            return { success: true };
        } catch (error) {
            console.error("Mark read error", error);
            return { success: false };
        }
    },

    markAllNotificationsAsRead: async () => {
        try {
            await api.post('/api/notifications/read-all');
            return { success: true };
        } catch (error) {
            console.error("Mark all read error", error);
            return { success: false };
        }
    },

    deleteNotification: async (id) => {
        try {
            await api.delete(`/api/notifications/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete notification error", error);
            return { success: false };
        }
    },

    clearNotifications: async () => {
        try {
            await api.delete('/api/notifications/clear-history');
            return { success: true };
        } catch (error) {
            console.error("Clear notifications error", error);
            return { success: false };
        }
    },

    // --- Assignment APIs ---
    assignPM: async (projectId, userId) => {
        try {
            await api.post(`/api/projects/${projectId}/assign-pm?userId=${userId}`);
            return { success: true };
        } catch (error) {
            console.error("Assign PM error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    addForeman: async (projectId, foremanId) => {
        try {
            await api.post(`/api/projects/${projectId}/foremen/${foremanId}`);
            return { success: true };
        } catch (error) {
            console.error("Add foreman error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    removeForeman: async (projectId, foremanId) => {
        try {
            await api.delete(`/api/projects/${projectId}/foremen/${foremanId}`);
            return { success: true };
        } catch (error) {
            console.error("Remove foreman error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    getProjectForemen: async (projectId) => {
        try {
            const response = await api.get(`/api/projects/${projectId}/foremen`);
            return response.data;
        } catch (error) {
            console.error("Get project foremen error", error);
            return [];
        }
    },

    addSubObjectWorker: async (subObjectId, workerId) => {
        try {
            await api.post(`/api/sub-objects/${subObjectId}/workers/${workerId}`);
            return { success: true };
        } catch (error) {
            console.error("Add sub-object worker error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    removeSubObjectWorker: async (subObjectId, workerId) => {
        try {
            await api.delete(`/api/sub-objects/${subObjectId}/workers/${workerId}`);
            return { success: true };
        } catch (error) {
            console.error("Remove sub-object worker error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    getSubObjectWorkers: async (subObjectId) => {
        try {
            const response = await api.get(`/api/sub-objects/${subObjectId}/workers`);
            return response.data;
        } catch (error) {
            console.error("Get sub-object workers error", error);
            return [];
        }
    },

    // --- Template APIs ---
    getTemplates: async () => {
        try {
            const response = await api.get('/api/templates');
            return response.data;
        } catch (error) {
            console.error("Get templates error", error);
            return [];
        }
    },

    createTemplate: async (templateData) => {
        try {
            const response = await api.post('/api/templates', templateData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Create template error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to create template', status: error.response?.status };
        }
    },

    deleteTemplate: async (id) => {
        try {
            await api.delete(`/api/templates/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete template error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete template', status: error.response?.status };
        }
    },
    // --- SubObject Template APIs ---
    createSubObjectTemplate: async (name) => {
        try {
            const response = await api.post(`/api/templates/sub-object?name=${encodeURIComponent(name)}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Create sub-object template error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    getAllSubObjectTemplates: async () => {
        try {
            const response = await api.get('/api/templates/sub-object');
            return response.data;
        } catch (error) {
            console.error("Get sub-object templates error", error);
            return [];
        }
    },

    addTaskTemplateToSubObject: async (templateId, taskName, checklistTemplateId, orderIndex) => {
        try {
            const response = await api.post(`/api/templates/sub-object/${templateId}/tasks`, null, {
                params: { taskName, checklistTemplateId, orderIndex }
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Add task template error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    deleteSubObjectTemplate: async (id) => {
        try {
            await api.delete(`/api/templates/sub-object/${id}`);
            return { success: true };
        } catch (error) {
            console.error("Delete sub-object template error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    applySubObjectTemplate: async (templateId, subObjectId) => {
        try {
            const response = await api.post(`/api/templates/sub-object/${templateId}/apply/${subObjectId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Apply template error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    updateTemplate: async (id, data) => {
        try {
            const response = await api.put(`/api/templates/${id}`, data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update template error", error);
            return { success: false, message: error.response?.data?.message || 'Failed to update template', status: error.response?.status };
        }
    },

    updateSubObjectTemplate: async (id, name) => {
        try {
            const response = await api.put(`/api/templates/sub-object/${id}?name=${encodeURIComponent(name)}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Update sub-object template error", error);
            return { success: false, message: error.response?.data?.message };
        }
    },

    deleteTaskTemplateFromSubObject: async (taskId) => {
        try {
            await api.delete(`/api/templates/sub-object/tasks/${taskId}`);
            return { success: true };
        } catch (error) {
            // Fallback for mock/compatibility if strict endpoint doesn't exist
            console.error("Delete task template error", error);
            return { success: false, message: error.response?.data?.message };
        }
    }
};

export default apiClient;
