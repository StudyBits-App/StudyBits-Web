import React, { useEffect, useState } from "react";
import styles from "./UnitCard.module.css";
import { Unit } from "@/utils/interfaces";
import { getUnit } from "@/sevices/getUserData";

interface UnitCardProps {
  id: string;
  courseId: string;
  selected: boolean;
  list: boolean;
  onPress?: () => void;
  onUnitNotFound?: (unitId: string) => void;
}

const UnitCard: React.FC<UnitCardProps> = ({
  id,
  courseId,
  selected,
  list,
  onPress,
  onUnitNotFound,
}) => {
  const [unit, setUnit] = useState<Unit | null>(null);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const unitDoc = await getUnit(courseId, id);
        if (unitDoc && "data" in unitDoc) {
          const unitData = unitDoc.data() as Unit;
          setUnit(unitData);
        } else {
          onUnitNotFound?.(id);
        }
      } catch (error) {
        console.error("Error fetching unit: ", error);
        onUnitNotFound?.(id);
      }
    };

    fetchUnit();
  }, [id, courseId, onUnitNotFound]);

  return (
    <button
      className={`${styles.card} ${
        selected ? styles.selected : styles.unselected
      } ${list ? styles.listSpacing : ""}`} 
      onClick={() => {
        if (onPress && unit) onPress();
      }}
    >
      <div>
        <p className={styles.contentTitle}>{unit ? unit.name : "Loading..."}</p>
        <p className={styles.subText}>
          {unit ? unit.description : "Please wait"}
        </p>
      </div>
    </button>
  );
};

export default UnitCard;
