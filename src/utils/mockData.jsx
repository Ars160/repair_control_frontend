// src/utils/mockData.js

/**
 * Mock data for the application.
 * In a real application, this data would come from a backend API.
 */

// Define user roles (match backend enums)
export const ROLES = {
  WORKER: 'WORKER',
  FOREMAN: 'FOREMAN',
  PM: 'PM',
  ESTIMATOR: 'ESTIMATOR',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

// Define task statuses (match backend enums)
export const STATUSES = {
  LOCKED: 'LOCKED',
  ACTIVE: 'ACTIVE',
  UNDER_REVIEW_FOREMAN: 'UNDER_REVIEW_FOREMAN',
  UNDER_REVIEW_PM: 'UNDER_REVIEW_PM',
  REWORK: 'REWORK',
  COMPLETED: 'COMPLETED',
};

// Define task types (match backend enums)
export const TASK_TYPES = {
  SEQUENTIAL: 'SEQUENTIAL',
  PARALLEL: 'PARALLEL',
};

// Mock user data
export const users = [
  { id: 1, name: 'Иван Рабочий', role: ROLES.WORKER },
  { id: 2, name: 'Петр Прорабов', role: ROLES.FOREMAN },
  { id: 3, name: 'Анна Менеджерова', role: ROLES.PM },
  { id: 4, name: 'Сергей Сметчиков', role: ROLES.ESTIMATOR },
  { id: 5, name: 'Всеволод Админов', role: ROLES.SUPER_ADMIN },
];

// Mock task data
export const tasks = [
  {
    id: 1,
    title: 'Штукатурка стен',
    object: 'Квартира #101',
    priority: 'high',
    status: STATUSES.ACTIVE,
    task_type: TASK_TYPES.SEQUENTIAL,
    deadline: '2026-01-20T23:59:59',
    assigned_to: 1,
    checklist: [
      { id: 1, text: 'Подготовить поверхность', completed: true },
      { id: 2, text: 'Нанести первый слой', completed: true },
      { id: 3, text: 'Нанести второй слой', completed: false },
    ],
    submission: null,
  },
  {
    id: 2,
    title: 'Электромонтажные работы',
    object: 'Квартира #101',
    priority: 'high',
    status: STATUSES.LOCKED,
    task_type: TASK_TYPES.SEQUENTIAL,
    deadline: '2026-01-22T23:59:59',
    assigned_to: 1,
    checklist: [
      { id: 1, text: 'Проложить кабели', completed: false },
      { id: 2, text: 'Установить розетки', completed: false },
      { id: 3, text: 'Смонтировать освещение', completed: false },
    ],
    submission: null,
  },
  {
    id: 3,
    title: 'Установка сантехники',
    object: 'Квартира #102',
    priority: 'medium',
    status: STATUSES.UNDER_REVIEW_FOREMAN,
    task_type: TASK_TYPES.PARALLEL,
    deadline: '2026-01-18T23:59:59',
    submitted_at: '2026-01-17T18:00:00',
    assigned_to: 1,
    checklist: [
      { id: 1, text: 'Установить унитаз', completed: true },
      { id: 2, text: 'Смонтировать раковину', completed: true },
      { id: 3, text: 'Подключить смесители', completed: true },
    ],
    submission: {
      photos: ['./styazhka-1.png', '/mock-images/photo2.jpg'],
      comment: 'Все установлено согласно плану.',
    },
  },
  {
    id: 4,
    title: 'Покраска стен',
    object: 'Квартира #101',
    priority: 'low',
    status: STATUSES.REWORK,
    task_type: TASK_TYPES.PARALLEL,
    deadline: '2026-01-25T23:59:59',
    assigned_to: 1,
    checklist: [
        { id: 1, text: 'Подготовить краску', completed: true },
        { id: 2, text: 'Нанести первый слой', completed: true },
        { id: 3, text: 'Обнаружены потеки, требуется перекраска', completed: false },
    ],
    submission: {
        photos: ['/mock-images/photo3.jpg'],
        comment: 'Есть потеки на стене у окна. Нужно переделать.',
    },
  },
    {
    id: 5,
    title: 'Проверка сметы',
    object: 'Офис #205',
    priority: 'high',
    status: STATUSES.ACTIVE,
    task_type: TASK_TYPES.PARALLEL,
    deadline: '2026-01-19T23:59:59',
    assigned_to: 4,
    checklist: [
        { id: 1, text: 'Проверить стоимость материалов', completed: false },
        { id: 2, text: 'Проверить объемы работ', completed: false },
    ],
    submission: null,
  },
  {
    id: 6,
    title: 'Укладка плитки в ванной',
    object: 'Квартира #102',
    priority: 'high',
    status: STATUSES.COMPLETED,
    task_type: TASK_TYPES.PARALLEL,
    deadline: '2026-01-15T23:59:59',
    submitted_at: '2026-01-15T14:30:00',
    assigned_to: 1,
    checklist: [
      { id: 1, text: 'Выровнять пол', completed: true },
      { id: 2, text: 'Положить плитку', completed: true },
      { id: 3, text: 'Затереть швы', completed: true },
    ],
    submission: {
      photos: ['/mock-images/photo4.jpg'],
      comment: 'Работа выполнена качественно и в срок.',
    },
  },
];
