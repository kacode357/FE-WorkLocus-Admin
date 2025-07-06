"use client";

import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { EmployeeSelector, User } from "./components/1-employee-selector";
import { ReviewManager, Review } from "./components/2-review-manager";
import { PayrollCalculator } from "./components/3-payroll-calculator";
import { PayrollResultDialog } from "./components/4-payroll-result-dialog";
import { searchAdminUsersApi } from "@/services/admin.services";

export default function PayrollPage() {
  const [date, setDate] = useState<Date>(new Date());
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
        pageInfo: { pageNum: 1, pageSize: 1 }
      });

      if (response.data.records.length > 0) {
        const newUser = response.data.records[0];
        setSelectedUser(newUser);
      }
    } catch (error) {
      console.error("-> Lỗi toang khi chạy refreshSelectedUser:", error);
    }
  }, [selectedUser]);

  const selectedMonth = date.getMonth() + 1;
  const selectedYear = date.getFullYear();

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tính lương Nhân viên</h1>
          <p className="text-muted-foreground">Thực hiện tính lương theo quy trình từng bước.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quy trình tính lương</CardTitle>
            <CardDescription>Bắt đầu bằng cách chọn tháng và nhân viên cần tính lương.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">1. Chọn tháng/năm</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-2")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) {
                          setDate(d);
                          setSelectedUser(null);
                          setActiveReview(null);
                        }
                      }}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={2030}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium">2. Chọn nhân viên</label>
                <div className="mt-2">
                  <EmployeeSelector onUserSelect={handleUserSelect} />
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
                      month={selectedMonth}
                      year={selectedYear}
                      onReviewComplete={setActiveReview}
                    />
                  </div>
                  {activeReview && (
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold">4. Nhập thông số & Tính lương</h3>
                      <PayrollCalculator
                        user={selectedUser}
                        review={activeReview}
                        month={selectedMonth}
                        year={selectedYear}
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