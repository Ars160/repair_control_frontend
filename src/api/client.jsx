import axios from 'axios';

const API_URL = 'http://localhost:8080';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
});

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

export const apiClient = {
    // Login with email and password
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
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
                    object: `${task.objectName} - ${task.subObjectName}`,
                    priority: task.priority || 'MEDIUM', // Use actual priority from backend
                    status: task.status,
                    checklist: task.checklist || [],
                    submission
                };
            });

            // Filter based on role (replicating mock logic)
            switch (userRole) {
                case 'WORKER':
                    return allTasks.filter(t =>
                        // Assignee check - only show tasks worker can edit
                        t.assigneeIds && t.assigneeIds.includes(userId) &&
                        ['ACTIVE', 'REWORK_FOREMAN'].includes(t.status)
                    );
                case 'FOREMAN':
                    return allTasks.filter(t => t.status === 'UNDER_REVIEW_FOREMAN' || t.status === 'REWORK_PM');
                case 'PM':
                    return allTasks.filter(t => t.status === 'UNDER_REVIEW_PM');
                case 'ESTIMATOR':
                    return allTasks;
                case 'SUPER_ADMIN':
                    return allTasks;
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
                object: `${task.objectName} - ${task.subObjectName}`,
                priority: 'medium',
                checklist: task.checklist || [],
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

    getProjects: async () => {
        try {
            const response = await api.get('/api/projects');
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

    getTasksBySubObject: async (subObjectId) => {
        try {
            const response = await api.get(`/api/tasks/sub-object/${subObjectId}`);
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

    createChecklistItem: async (taskId, description, orderIndex, isPhotoRequired = false) => {
        try {
            const response = await api.post(`/api/checklist/task/${taskId}`, {
                description,
                orderIndex,
                isPhotoRequired
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
    }
};

export default apiClient;
