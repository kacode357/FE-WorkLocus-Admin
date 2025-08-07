"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmployeeSelector, User } from "./components/1-employee-selector";
import { ReviewManager, Review } from "./components/2-review-manager";
import { PayrollCalculator } from "./components/3-payroll-calculator";
import { PayrollResultDialog } from "./components/4-payroll-result-dialog";
import { PayrollResultPanel } from "./components/5-payroll-result-panel";
import { searchAdminUsersApi } from "@/services/admin.services";

/* ------------------------------------------------- */
/* Dropdown helper                                   */
/* ------------------------------------------------- */
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
const YEARS  = Array.from({ length: 11 }, (_, i) => 2020 + i);

function CustomDropdown({
  value, options, onChange
}: {
  value: number;
  options: { value: number; label: string }[];
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && selectedRef.current) selectedRef.current.scrollIntoView({ block: "nearest" });
  }, [open]);

  return (
    <div ref={ref} className="relative w-full min-w-[120px] max-w-[160px]">
      <button
        type="button"
        className="w-full h-10 px-4 flex items-center justify-between rounded-xl border border-input bg-background shadow-sm hover:border-primary transition"
        onClick={() => setOpen(!open)}
      >
        <span>{selected?.label ?? "Chọn"}</span>
        <span className="opacity-70">&#9662;</span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-full max-h-60 overflow-auto rounded-xl border bg-white shadow-xl animate-fadeIn">
          {options.map(o => (
            <div
              key={o.value}
              ref={value === o.value ? selectedRef : undefined}
              className={`px-4 py-2 flex items-center gap-2 cursor-pointer rounded-xl hover:bg-accent transition
                ${value === o.value ? "bg-primary/10 font-semibold text-primary" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span>{o.label}</span>
              {value === o.value && (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="ml-auto text-primary">
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
/* --- Month/Year picker --- */
const MonthYearPicker = ({
  month, year, setMonth, setYear
}: {
  month: number; year: number;
  setMonth: (m: number) => void; setYear: (y: number) => void;
}) => (
  <div className="flex gap-4">
    <CustomDropdown value={month} options={MONTHS} onChange={setMonth} />
    <CustomDropdown value={year}  options={YEARS.map(y => ({ value: y, label: y + "" }))} onChange={setYear} />
  </div>
);

/* ------------------------------------------------- */
/* MAIN PAGE                                         */
/* ------------------------------------------------- */
export default function PayrollPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year,  setYear]  = useState(today.getFullYear());

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [payrollResult, setPayrollResult] = useState<any | null>(null);

  /* ---------- helpers ---------- */
  const resetProcess = () => {
    setPayrollResult(null);
    setSelectedUser(null);
    setActiveReview(null);
  };

  const handleUserSelect = (u: User | null) => {
    setSelectedUser(u);
    setActiveReview(null);
  };

  const refreshSelectedUser = useCallback(async () => {
    if (!selectedUser?._id) return;
    try {
      const res = await searchAdminUsersApi({
        searchCondition: { keyword: selectedUser._id, is_activated: null, role: "" },
        pageInfo: { pageNum: 1, pageSize: 1 }
      });
      if (res.data.records.length) setSelectedUser(res.data.records[0]);
    } catch (err) { console.error("refreshSelectedUser:", err); }
  }, [selectedUser]);

  /* ---------- RENDER ---------- */
  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tính lương Nhân viên</h1>

        <Card>
          <CardHeader>
            <CardTitle>Quy trình tính lương</CardTitle>
            <CardDescription>
              Bắt đầu bằng cách chọn tháng và nhân viên cần tính lương.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* STEP 1 & 2 */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <span className="text-sm font-medium">1.&nbsp;Chọn tháng/năm</span>
                <MonthYearPicker
                  month={month} year={year}
                  setMonth={setMonth} setYear={setYear}
                />
              </div>
              <div>
                <span className="text-sm font-medium">2.&nbsp;Chọn nhân viên</span>
                <div className="mt-2 max-h-60 overflow-y-auto">
                  <EmployeeSelector onUserSelect={handleUserSelect} />
                </div>
              </div>
            </div>

            {selectedUser && (
              <>
                <Separator />

                {/* grid step3 + step4 (desktop trái 280px) */}
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  {/* step 3 (Review) */}
                  <ReviewManager
                    userId={selectedUser._id}
                    month={month}
                    year={year}
                    onReviewComplete={setActiveReview}
                  />

                  {/* step 4 (Calculator) */}
                  {activeReview && (
                    <PayrollCalculator
                      user={selectedUser}
                      review={activeReview}
                      month={month}
                      year={year}
                      onCalculationSuccess={setPayrollResult}
                      onUserUpdate={refreshSelectedUser}
                    />
                  )}
                </div>

                {/* Kết quả hiển thị dưới bước 4 */}
                {payrollResult && (
                  <PayrollResultPanel payroll={payrollResult} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog popup (disable / enable tùy) */}
      <PayrollResultDialog
        isOpen={false}
        onOpenChange={(o) => !o && resetProcess()}
        payrollResult={payrollResult}
      />
    </>
  );
}
