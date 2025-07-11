"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CourseDisplay } from "@/components/course-display";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { Unit } from "@/utils/interfaces";
import { getUnitsForCourse, saveUnit, deleteUnit } from "@/services/courseUnitData";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";

export default function ManageCoursePage() {
  const { id } = useParams();
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    async function fetchUnits() {
      if (id && typeof id === "string") {
        const data = await getUnitsForCourse(id);
        setUnits(data);
      }
    }
    fetchUnits();
  }, [id]);

  const updateUnitField = (key: string, field: keyof Unit, value: string) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.key === key ? { ...unit, [field]: value } : unit
      )
    );
  };

  const handleSave = async (unit: Unit) => {
    if (!id || typeof id !== "string") return;
    await saveUnit(id, unit);
  };

  const handleDelete = async (unitKey: string) => {
    if (!id || typeof id !== "string") return;
    await deleteUnit(id, unitKey);
    setUnits((prev) => prev.filter((unit) => unit.key !== unitKey));
  };

  const handleAddUnit = () => {
    const newUnit: Unit = {
      key: uuidv4(),
      name: "",
      description: "",
      order: units.length,
    };
    setUnits((prev) => [...prev, newUnit]);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="p-6 space-y-6 bg-zinc-950 min-h-screen">
        <div className="max-w-6xl w-full mx-auto px-6 my-6 space-y-6">
          <CourseDisplay courseId={id as string} />

          <div className="bg-zinc-900 rounded-2xl shadow-md p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Units</h1>
            <IconPlus
              className="w-10 h-10 text-white cursor-pointer"
              onClick={handleAddUnit}
            />
          </div>

          {units.map((unit) => (
            <div
              key={unit.key}
              className="bg-zinc-900 rounded-xl p-4 shadow-sm flex flex-col space-y-4"
            >
              <div className="flex items-center space-x-4">
                <Input
                  className="bg-zinc-900 text-white placeholder-zinc-400 border-zinc-600 flex-1"
                  value={unit.name}
                  placeholder="Unit name"
                  onChange={(e) =>
                    updateUnitField(unit.key, "name", e.target.value)
                  }
                  onBlur={() => handleSave(unit)}
                />
                <button
                  onClick={() => handleDelete(unit.key)}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                  title="Delete Unit"
                >
                  <IconTrash />
                </button>
              </div>

              <textarea
                className="bg-zinc-900 border border-zinc-600 text-white rounded-md w-full p-2 resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-zinc-500"
                value={unit.description}
                onChange={(e) =>
                  updateUnitField(unit.key, "description", e.target.value)
                }
                onBlur={() => handleSave(unit)}
                placeholder="Unit description"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
