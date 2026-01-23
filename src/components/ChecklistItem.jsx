// src/components/ChecklistItem.jsx
import React from 'react';

const ChecklistItem = ({ item, isEditable, onToggle }) => {
    return (
        <div 
            className={`flex items-center p-3 rounded-md transition-colors duration-200 ${isEditable ? 'hover:bg-gray-50' : ''}`}
        >
            <input
                type="checkbox"
                id={`item-${item.id}`}
                checked={item.completed}
                onChange={() => onToggle(item.id)}
                disabled={!isEditable}
                className={`h-5 w-5 rounded ${isEditable ? 'cursor-pointer' : ''} text-indigo-600 focus:ring-indigo-500 border-gray-300`}
            />
            <label
                htmlFor={`item-${item.id}`}
                className={`ml-3 block text-sm font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-700'} ${isEditable ? 'cursor-pointer' : ''}`}
            >
                {item.text}
            </label>
        </div>
    );
};

export default ChecklistItem;
