import type { PrintProject } from '@/types'

const STORAGE_KEY = 'print_layout_projects'

export async function fetchPrintProjects(): Promise<PrintProject[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export async function savePrintProject(
  project: Omit<PrintProject, 'id' | 'createdAt'> & { id?: string },
): Promise<PrintProject> {
  const projects = await fetchPrintProjects()

  if (project.id) {
    const index = projects.findIndex((p) => p.id === project.id)
    if (index !== -1) {
      projects[index] = { ...project, createdAt: projects[index].createdAt } as PrintProject
      saveToStorage(projects)
      return projects[index]
    }
  }

  const newProject: PrintProject = {
    ...project,
    id: `project-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  }
  projects.push(newProject)
  saveToStorage(projects)
  return newProject
}

export async function deletePrintProject(id: string): Promise<void> {
  const projects = await fetchPrintProjects()
  const filtered = projects.filter((p) => p.id !== id)
  saveToStorage(filtered)
}

export async function fetchPrintProject(id: string): Promise<PrintProject | null> {
  const projects = await fetchPrintProjects()
  return projects.find((p) => p.id === id) || null
}

function saveToStorage(projects: PrintProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {
    console.error('Failed to save print projects')
  }
}
