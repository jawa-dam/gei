import type { Project } from './Project';

export class Workspace {
  private readonly projects: Project[] = [];

  addProject(project: Project): void {
    this.projects.push(project);
  }

  getProjects(): readonly Project[] {
    return [...this.projects];
  }
}