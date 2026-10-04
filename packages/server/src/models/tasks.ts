export interface Tasks {
    tasks: Array<Task>;
}

export interface TaskDetails {
    title: string;
    description?: string;
    notes?: string;
    dueDate?: string;
    category?: string;
    categoryColor?: string;
}

export interface Task extends TaskDetails {
    id: string;
    userid: string;
    completed: boolean;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}
