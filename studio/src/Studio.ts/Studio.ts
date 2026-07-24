import type { Workspace } from './Workspace';

export class Studio {
  constructor(private readonly workspace: Workspace) {}

  getWorkspace(): Workspace {
    return this.workspace;
  }
}