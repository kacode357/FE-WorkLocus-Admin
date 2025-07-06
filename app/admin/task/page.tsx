"use client";

import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ProjectList } from "./components/project-list";
import { TaskBoard } from "./components/task-board";

export default function TaskPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return (
    <div className="h-full">
        <div className="flex justify-between items-center mb-4 px-4">
            <div>
                <h1 className="text-2xl font-bold">Quản lý Công việc</h1>
                <p className="text-muted-foreground">Chọn dự án để xem và quản lý công việc chi tiết.</p>
            </div>
        </div>
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-10rem)] rounded-lg border">
        <ResizablePanel defaultSize={40} minSize={30}> {/* Đã chỉnh từ 30 thành 40 */}
          <div className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Danh sách dự án</h2>
            <ProjectList 
                selectedProjectId={selectedProjectId}
                onProjectSelect={setSelectedProjectId}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}> {/* Đã chỉnh từ 75 thành 60 */}
            <TaskBoard projectId={selectedProjectId!} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}