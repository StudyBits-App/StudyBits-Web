"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CourseDisplay } from "@/components/course-display";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { Unit } from "@/utils/interfaces";
import { getUnitsForCourse, saveUnit } from "@/services/courseUnitData";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteQuestionsForUnit,
  deleteUnit,
  handleChannelCourseDelete,
} from "@/services/deleteCourseUnitData";
import { useAuth } from "@/hooks/authContext";
import { getChannelData } from "@/services/channelHelpers";
import { cacheCoursesAndUnits } from "@/services/cacheServices";

export default function ManageCoursePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const router = useRouter();
  const STORAGE_PREFIX = `channel-unit-${id}-`;

  useEffect(() => {
    async function verifyId() {
      const channelData = await getChannelData(user?.uid as string);
      const courseArray = channelData?.courses;
      if (Array.isArray(courseArray) && !courseArray.includes(id as string))
        router.push("/channel");
    }
    async function fetchUnits() {
      if (!id || typeof id !== "string") return;

      const units: Unit[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const unit = JSON.parse(item) as Unit;
              units.push(unit);
            } catch {
              console.warn("Invalid cached unit:", key);
            }
          }
        }
      }

      if (units.length > 0) {
        setUnits(units);
      } else {
        const data = await getUnitsForCourse(id);
        setUnits(data);
      }
    }

    verifyId();
    fetchUnits();
  }, [STORAGE_PREFIX, id, router, user?.uid]);


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
    localStorage.setItem(`${STORAGE_PREFIX}${unit.key}`, JSON.stringify(unit));
  };

  const handleDelete = async (unitKey: string) => {
    if (!id || typeof id !== "string") return;

    alert(
      "Warning: Deleting this unit will delete all of the questions associated with it."
    );
    const confirmed = window.confirm("Do you really want to delete this unit?");
    if (!confirmed) return;

    await deleteUnit(id, unitKey);
    await deleteQuestionsForUnit(id, unitKey);
    setUnits((prev) => prev.filter((unit) => unit.key !== unitKey));
    localStorage.removeItem(`${STORAGE_PREFIX}${unitKey}`);
  };

  const handleCourseDelete = async () => {
    await handleChannelCourseDelete(id as string, user?.uid as string);
    await cacheCoursesAndUnits(user?.uid as string);
    router.push("/");
  };

  const handleAddUnit = () => {
    const newUnit: Unit = {
      key: uuidv4(),
      name: "",
      description: "",
      order: units.length,
    };
    setUnits((prev) => [...prev, newUnit]);
    localStorage.setItem(
      `${STORAGE_PREFIX}${newUnit.key}`,
      JSON.stringify(newUnit)
    );
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
          <Card className="bg-zinc-900 border border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-white">
                  Course Details
                </h1>

                <IconTrash
                  className="w-6 h-6 text-red-500 cursor-pointer"
                  onClick={handleCourseDelete}
                />
              </div>
            </CardContent>
          </Card>

          <CourseDisplay courseId={id as string} cache={true} />

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
              <div className="flex items-center space-x-2">
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
