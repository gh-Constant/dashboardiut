'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ScheduleState {
  department: string
  school: string
  class: string
  subclass: string
  semester: string
}

interface ScheduleContextType {
  state: ScheduleState
  setDepartment: (department: string) => void
  setSchool: (school: string) => void
  setClass: (class_: string) => void
  setSubclass: (subclass: string) => void
  setSemester: (semester: string) => void
  resetSelections: () => void
}

const initialState: ScheduleState = {
  department: '',
  school: '',
  class: '',
  subclass: '',
  semester: '',
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined)

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScheduleState>(initialState)

  const setDepartment = (department: string) => {
    setState(() => ({
      ...initialState,
      department,
    }))
  }

  const setSchool = (school: string) => {
    setState((prev) => ({
      ...prev,
      school,
      class: '',
      subclass: '',
      semester: '',
    }))
  }

  const setSemester = (semester: string) => {
    setState((prev) => ({
      ...prev,
      semester,
      class: '',
      subclass: '',
    }))
  }

  const setClass = (class_: string) => {
    setState((prev) => ({
      ...prev,
      class: class_,
      subclass: '',
    }))
  }

  const setSubclass = (subclass: string) => {
    setState((prev) => ({
      ...prev,
      subclass,
    }))
  }

  const resetSelections = () => {
    setState(initialState)
  }

  return (
    <ScheduleContext.Provider
      value={{
        state,
        setDepartment,
        setSchool,
        setClass,
        setSubclass,
        setSemester,
        resetSelections,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  const context = useContext(ScheduleContext)
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider')
  }
  return context
} 