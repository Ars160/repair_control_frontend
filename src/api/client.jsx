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
                        photos: task.report.photos || []
                    }
                    : null;
                return {
                    ...task,
                    object: `${task.objectName} - ${task.subObjectName}`,
                    priority: 'medium',
                    status: task.status,
                    checklist: task.checklist || [],
                    submission
                };
            });

            // Filter based on role (replicating mock logic)
            switch (userRole) {
                case 'WORKER':
                    return allTasks.filter(t =>
                        // Assignee check
                        t.assigneeIds && t.assigneeIds.includes(userId) &&
                        ['ACTIVE', 'REWORK', 'UNDER_REVIEW_FOREMAN', 'UNDER_REVIEW_PM'].includes(t.status)
                    );
                case 'FOREMAN':
                    return allTasks.filter(t => t.status === 'UNDER_REVIEW_FOREMAN');
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
                    photos: task.report.photos || []
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
        const formData = new FormData();

        const reportDto = {
            comment: data.comment,
            checklistAnswers: data.checklist ? data.checklist.map(item => ({
                checklistItemId: item.id,
                completed: item.completed
            })) : []
        };

        formData.append('report', JSON.stringify(reportDto));

        if (data.photos && data.photos.length > 0) {
            data.photos.forEach(file => {
                formData.append('files', file);
            });
        }

        try {
            await api.post(`/api/tasks/${taskId}/report`, formData);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to submit report' };
        }
    },

    updateTaskStatus: async (taskId, newStatus, comment) => {
        try {
            if (newStatus === 'COMPLETED' || newStatus === 'UNDER_REVIEW_PM') {
                // Determine if it's approve based on status transition, but the endpoint is just /approve
                // The backend handles the state transition logic based on current status and user role
                await api.post(`/api/tasks/${taskId}/approve`);
            } else if (newStatus === 'REWORK') {
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
    }
};

export default apiClient;
