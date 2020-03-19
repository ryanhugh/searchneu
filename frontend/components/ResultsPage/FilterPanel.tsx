import React from "react";
import FilterBreadcrumb from "./FilterBreadcrumb"


export type ActiveFilters = {
    online?: boolean,
    NUpath?: string[],
    subject?: string[],
    classType?: string[],
  }
  
export interface FilterPanelProps {
    options: FilterOptions,
    active: ActiveFilters,
    setActive: (f: ActiveFilters) => void,
  }





export default function FilterPanel({ options, active, setActive }: FilterPanelProps)  {


    return (
        <div className="FilterPanel">
        </div>
    )

}