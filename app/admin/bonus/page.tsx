"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import BonusService from "@/services/bonus.services";
import { BonusFormDialog, Bonus } from "./components/bonus-form-dialog";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export default function BonusPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ open: boolean; bonus?: Bonus }>({ open: false });
  const [deleteAlert, setDeleteAlert] = useState<{ open: boolean; bonus?: Bonus }>({ open: false });
  
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 500);

  const fetchBonuses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await BonusService.searchBonuses({
        searchCondition: { keyword: debouncedKeyword },
        pageInfo: { pageNum: 1, pageSize: 100 },
      });
      setBonuses(response.data.records);
    } catch (error) {
      console.error("Lỗi khi tải mức thưởng:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedKeyword]);

  useEffect(() => {
    fetchBonuses();
  }, [fetchBonuses]);

  const handleDelete = async () => {
    if (!deleteAlert.bonus) return;
    try {
      await BonusService.deleteBonus(deleteAlert.bonus._id);
      toast.success("Xóa mức thưởng thành công.");
      fetchBonuses(); // Tải lại danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa.");
    } finally {
      setDeleteAlert({ open: false });
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quản lý Mức thưởng/phạt</CardTitle>
            <CardDescription>Thêm, sửa, xóa các mức thưởng phạt cho nhân viên.</CardDescription>
          </div>
          <Button onClick={() => setDialogState({ open: true })}>
            <PlusCircle className="mr-2 h-4 w-4"/>Tạo mới
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Tìm theo xếp loại hoặc mô tả..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Xếp loại</TableHead>
                  <TableHead className="w-48">Mức thưởng/phạt</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="w-24 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({length: 4}).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
                ) : bonuses.length > 0 ? (
                  bonuses.map((bonus) => (
                    <TableRow key={bonus._id}>
                      <TableCell className="font-bold text-lg">{bonus.grade}</TableCell>
                      <TableCell className={`font-semibold ${bonus.bonus_amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formatCurrency(bonus.bonus_amount)}
                      </TableCell>
                      <TableCell>{bonus.description}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setDialogState({ open: true, bonus: bonus })}>
                              <Pencil className="mr-2 h-4 w-4"/>Sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteAlert({ open: true, bonus: bonus })} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4"/>Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">Không tìm thấy dữ liệu.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog tạo/sửa */}
      <BonusFormDialog 
        isOpen={dialogState.open}
        onOpenChange={(open) => setDialogState({ open })}
        bonus={dialogState.bonus}
        onActionComplete={fetchBonuses}
      />

      {/* Dialog xác nhận xóa */}
      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Mức thưởng/phạt <strong className="font-bold">{deleteAlert.bonus?.grade}</strong> sẽ bị xóa vĩnh viễn.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}