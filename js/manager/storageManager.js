/* ============================================
   STORAGE MANAGER (localStorage)
   ============================================ */

class StorageManager {
    /**
     * Save project to localStorage
     */
    static saveProject(project) {
        try {
            const projectData = project.toJSON();
            const sanitized = Sanitizer.sanitizeObject(projectData);
            const jsonString = JSON.stringify(sanitized);

            const allProjects = this.getAllProjects();
            const index = allProjects.findIndex(p => p.id === project.id);

            if (index !== -1) {
                allProjects[index] = sanitized;
            } else {
                allProjects.push(sanitized);
            }

            localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(allProjects));
            localStorage.setItem(CONSTANTS.STORAGE_CURRENT_PROJECT, project.id);

            return true;
        } catch (error) {
            console.error('Error saving project:', error);
            return false;
        }
    }

    /**
     * Load project from localStorage by ID
     */
    static loadProject(projectId) {
        try {
            const allProjects = this.getAllProjects();
            const projectData = allProjects.find(p => p.id === projectId);

            if (!projectData) {
                console.error('Project not found:', projectId);
                return null;
            }

            const project = Project.fromJSON(projectData);
            localStorage.setItem(CONSTANTS.STORAGE_CURRENT_PROJECT, projectId);
            return project;
        } catch (error) {
            console.error('Error loading project:', error);
            return null;
        }
    }

    /**
     * Get all projects
     */
    static getAllProjects() {
        try {
            const data = localStorage.getItem(CONSTANTS.STORAGE_KEY);
            if (!data) return [];
            return Sanitizer.safeJSONParse(data) || [];
        } catch (error) {
            console.error('Error getting projects:', error);
            return [];
        }
    }

    /**
     * Get current project ID
     */
    static getCurrentProjectId() {
        return localStorage.getItem(CONSTANTS.STORAGE_CURRENT_PROJECT);
    }

    /**
     * Load current project
     */
    static loadCurrentProject() {
        const projectId = this.getCurrentProjectId();
        if (!projectId) return null;
        return this.loadProject(projectId);
    }

    /**
     * Delete project
     */
    static deleteProject(projectId) {
        try {
            const allProjects = this.getAllProjects();
            const filtered = allProjects.filter(p => p.id !== projectId);

            localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(filtered));

            if (this.getCurrentProjectId() === projectId) {
                localStorage.removeItem(CONSTANTS.STORAGE_CURRENT_PROJECT);
            }

            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    }

    /**
     * Rename project
     */
    static renameProject(projectId, newName) {
        try {
            const allProjects = this.getAllProjects();
            const project = allProjects.find(p => p.id === projectId);

            if (project) {
                project.name = Sanitizer.sanitizeString(newName);
                localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(allProjects));
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error renaming project:', error);
            return false;
        }
    }

    /**
     * Get project list (info only, not full data)
     */
    static getProjectList() {
        const allProjects = this.getAllProjects();
        return allProjects.map(p => ({
            id: p.id,
            name: p.name,
            created: p.created,
            modified: p.modified,
            elementCount: p.elements ? p.elements.length : 0
        }));
    }

    /**
     * Export project as JSON file download
     */
    static exportProjectAsFile(project) {
        try {
            const projectData = project.toJSON();
            const jsonString = JSON.stringify(projectData, null, 2);
            const filename = `project-${project.name}-${Date.now()}.json`;

            Helpers.downloadFile(jsonString, filename, 'application/json');
            return true;
        } catch (error) {
            console.error('Error exporting project:', error);
            return false;
        }
    }

    /**
     * Import project from file
     */
    static importProjectFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const jsonString = e.target.result;
                    const projectData = Sanitizer.safeJSONParse(jsonString);

                    if (!projectData || !projectData.id || !projectData.elements) {
                        reject(new Error('Invalid project file format'));
                        return;
                    }

                    const project = Project.fromJSON(projectData);
                    this.saveProject(project);
                    resolve(project);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Duplicate project (in storage)
     */
    static duplicateProject(projectId) {
        try {
            const project = this.loadProject(projectId);
            if (!project) return null;

            project.id = Helpers.generateId();
            project.name = `${project.name} (kopia)`;
            project.created = Date.now();
            project.modified = Date.now();

            this.saveProject(project);
            return project;
        } catch (error) {
            console.error('Error duplicating project:', error);
            return null;
        }
    }

    /**
     * Clear all storage
     */
    static clearAllStorage() {
        try {
            localStorage.removeItem(CONSTANTS.STORAGE_KEY);
            localStorage.removeItem(CONSTANTS.STORAGE_CURRENT_PROJECT);
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get storage usage
     */
    static getStorageUsage() {
        try {
            const allProjects = this.getAllProjects();
            const totalSize = JSON.stringify(allProjects).length;

            return {
                projects: allProjects.length,
                bytes: totalSize,
                kb: (totalSize / 1024).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting storage usage:', error);
            return { projects: 0, bytes: 0, kb: 0 };
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
