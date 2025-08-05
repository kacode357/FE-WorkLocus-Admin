"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmployeeSelector, User } from "./components/1-employee-selector";
import { ReviewManager, Review } from "./components/2-review-manager";
import { PayrollCalculator } from "./components/3-payroll-calculator";
import { PayrollResultDialog } from "./components/4-payroll-result-dialog";
import { searchAdminUsersApi } from "@/services/admin.services";

// Danh sách tháng/năm cho dropdown
const MONTHS = [
  { value: 1, label: "Tháng 1" },
  { value: 2, label: "Tháng 2" },
  { value: 3, label: "Tháng 3" },
  { value: 4, label: "Tháng 4" },
  { value: 5, label: "Tháng 5" },
  { value: 6, label: "Tháng 6" },
  { value: 7, label: "Tháng 7" },
  { value: 8, label: "Tháng 8" },
  { value: 9, label: "Tháng 9" },
  { value: 10, label: "Tháng 10" },
  { value: 11, label: "Tháng 11" },
  { value: 12, label: "Tháng 12" },
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020 -> 2030

// Dropdown custom, đẹp, fix size, không phụ thuộc lib ngoài
function CustomDropdown({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { value: number; label: string }[];
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  // Auto scroll đến selected khi mở dropdown (nếu có nhiều item)
  const selectedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  return (
    <div className="relative min-w-[120px] max-w-[160px] w-full" ref={wrapperRef}>
      <button
        className="w-full h-10 px-4 rounded-xl border border-input shadow-sm bg-background text-left flex items-center justify-between hover:border-primary focus:outline-none transition"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span>{selected?.label ?? "Chọn"}</span>
        <span className="ml-2 opacity-70">&#9662;</span>
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border overflow-auto max-h-60 animate-fadeIn left-0">
          {options.map((o) => (
            <div
              key={o.value}
              ref={value === o.value ? selectedRef : undefined}
              className={`px-4 py-2 cursor-pointer rounded-xl flex items-center gap-2 
                hover:bg-accent transition
                ${value === o.value ? "bg-primary/10 font-semibold text-primary" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span>{o.label}</span>
              {value === o.value && (
                <svg width="18" height="18" fill="none" className="ml-auto text-primary" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeWidth="2" d="m6 10 3 3 5-5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Chọn tháng/năm, bỏ label, chỉ 2 dropdown cạnh nhau gọn
function MonthYearPicker({
  month,
  year,
  setMonth,
  setYear,
}: {
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
}) {
  return (
    <div className="flex gap-4">
      <CustomDropdown value={month} options={MONTHS} onChange={setMonth} />
      <CustomDropdown value={year} options={YEARS.map((y) => ({ value: y, label: y + "" }))} onChange={setYear} />
    </div>
  );
}

// ===== Component chính =====
export default function PayrollPage() {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [payrollResult, setPayrollResult] = useState<any | null>(null);

  const resetProcess = () => {
    setPayrollResult(null);
    setSelectedUser(null);
    setActiveReview(null);
  };

  const handleUserSelect = (user: User | null) => {
    setSelectedUser(user);
    setActiveReview(null);
  };

  const refreshSelectedUser = useCallback(async () => {
    if (!selectedUser?._id) {
      return;
    }
    try {
      const response = await searchAdminUsersApi({
        searchCondition: { keyword: selectedUser._id, is_activated: null, role: "" },
        pageInfo: { pageNum: 1, pageSize: 1 },
      });

      if (response.data.records.length > 0) {
        const newUser = response.data.records[0];
        setSelectedUser(newUser);
      }
    } catch (error) {
      console.error("-> Lỗi toang khi chạy refreshSelectedUser:", error);
    }
  }, [selectedUser]);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tính lương Nhân viên</h1>
          
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quy trình tính lương</CardTitle>
            <CardDescription>Bắt đầu bằng cách chọn tháng và nhân viên cần tính lương.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-sm font-medium">1. Chọn tháng/năm</span>
                <MonthYearPicker month={month} year={year} setMonth={setMonth} setYear={setYear} />
              </div>
              <div>
                <span className="text-sm font-medium">2. Chọn nhân viên</span>
                {/* Bọc EmployeeSelector chống tràn dropdown, thêm scroll cho danh sách user */}
                <div className="mt-2 relative">
                  <div className="max-h-60 overflow-y-auto">
                    <EmployeeSelector onUserSelect={handleUserSelect} />
                  </div>
                </div>
              </div>
            </div>
            {selectedUser && (
              <>
                <Separator />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">3. Đánh giá hiệu suất</h3>
                    <ReviewManager
                      userId={selectedUser._id}
                      month={month}
                      year={year}
                      onReviewComplete={setActiveReview}
                    />
                  </div>
                  {activeReview && (
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold">4. Nhập thông số & Tính lương</h3>
                      <PayrollCalculator
                        user={selectedUser}
                        review={activeReview}
                        month={month}
                        year={year}
                        onCalculationSuccess={setPayrollResult}
                        onUserUpdate={refreshSelectedUser}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <PayrollResultDialog
        isOpen={!!payrollResult}
        onOpenChange={(open) => !open && resetProcess()}
        payrollResult={payrollResult}
      />
    </>
  );
}

