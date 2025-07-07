"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Loader2,
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createWorkplaceApi,
  searchWorkplacesApi,
  updateWorkplaceApi,
  deleteWorkplaceApi,
  Workplace,
} from "@/services/admin.services";
import { AddressSearchInput } from "./components/address-search-combobox";
import { PlaceDetailsGoogle } from "@/services/openmap.services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Schema cho form tạo/sửa địa điểm
const workplaceFormSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(5, "Tên/Địa chỉ phải có ít nhất 5 ký tự."),
  latitude: z.coerce.number({ invalid_type_error: "Vĩ độ phải là số." }),
  longitude: z.coerce.number({ invalid_type_error: "Kinh độ phải là số." }),
});

type WorkplaceFormValues = z.infer<typeof workplaceFormSchema>;

export default function AddressPage() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<Workplace | null>(
    null
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const form = useForm<WorkplaceFormValues>({
    resolver: zodResolver(workplaceFormSchema),
    defaultValues: { name: "", latitude: 0, longitude: 0 },
  });

  const fetchWorkplaces = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await searchWorkplacesApi({
        pageInfo: { pageNum: page, pageSize: pageSize },
      });
      if (response.ok && response.data?.records) {
        setWorkplaces(response.data.records);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.totalRecords);
        setCurrentPage(response.data.pagination.currentPage);
      } else {
        setWorkplaces([]);
        setTotalPages(1);
        setTotalRecords(0);
        setCurrentPage(1);
      }
    } catch (err) {
      toast.error("Không thể tải dữ liệu địa điểm.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkplaces(currentPage);
  }, [currentPage]);

  const handleAddressSelect = (place: PlaceDetailsGoogle) => {
    form.setValue("name", place.formatted_address, { shouldValidate: true });
    form.setValue("latitude", place.geometry.location.lat, {
      shouldValidate: true,
    });
    form.setValue("longitude", place.geometry.location.lng, {
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: WorkplaceFormValues) => {
    setIsSubmitting(true);
    try {
      if (data._id) {
        await updateWorkplaceApi(data._id, {
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
        });
        toast.success("Cập nhật địa điểm thành công!");
      } else {
        await createWorkplaceApi({
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
        });
        toast.success("Tạo địa điểm mới thành công!");
      }
      form.reset();
      setIsDialogOpen(false);
      fetchWorkplaces(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xử lý địa điểm.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkplaceConfirm = async (workplaceId: string) => {
    try {
      await deleteWorkplaceApi(workplaceId);
      toast.success("Xóa địa điểm thành công!");
      if (workplaces.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchWorkplaces(currentPage);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa địa điểm.");
    }
  };

  const handleEditWorkplace = (workplace: Workplace) => {
    setEditingWorkplace(workplace);
    form.reset(workplace);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    form.reset({ name: "", latitude: 0, longitude: 0 });
    setEditingWorkplace(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"> {/* Thêm flex và justify-between */}
        <div>
          <h1 className="text-2xl font-bold">Quản lý Địa điểm làm việc</h1>
          <p className="text-muted-foreground">
            Tạo mới, xem, chỉnh sửa và xóa các địa điểm làm việc của công ty.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleEditWorkplace(null as any)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm địa điểm mới
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[600px]"
            onEscapeKeyDown={handleCloseDialog}
            onPointerDownOutside={handleCloseDialog}
          >
            <DialogHeader>
              <DialogTitle>
                {editingWorkplace
                  ? "Chỉnh sửa Địa điểm"
                  : "Thêm Địa điểm mới"}
              </DialogTitle>
              <DialogDescription>
                {editingWorkplace
                  ? "Cập nhật thông tin địa điểm này."
                  : "Điền thông tin để tạo địa điểm mới."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label>Tìm kiếm địa chỉ</Label>
                  <AddressSearchInput onAddressSelect={handleAddressSelect} />
                </div>
                <Separator />
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên/Địa chỉ đầy đủ</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vĩ độ (Latitude)</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kinh độ (Longitude)</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingWorkplace ? "Cập nhật Địa điểm" : "Tạo Địa điểm"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Địa điểm</CardTitle>
          <CardDescription>
            Quản lý tất cả các địa điểm làm việc hiện có.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên địa điểm</TableHead>
                  <TableHead>Vĩ độ</TableHead>
                  <TableHead>Kinh độ</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workplaces.length > 0 ? (
                  workplaces.map((workplace) => (
                    <TableRow key={workplace._id}>
                      <TableCell
                        className="font-medium max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis"
                        title={workplace.name} // Hiện full tên khi hover
                      >
                        {workplace.name}
                      </TableCell>
                      <TableCell>{workplace.latitude}</TableCell>
                      <TableCell>{workplace.longitude}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditWorkplace(workplace)}
                        >
                          Sửa
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Bạn có chắc chắn muốn xóa?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này sẽ xóa mềm địa điểm &quot;
                                {workplace.name}&quot;. Bạn có thể khôi phục lại
                                sau này nếu cần.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteWorkplaceConfirm(workplace._id!)
                                }
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Chưa có địa điểm nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Hiển thị {workplaces.length} trên tổng số {totalRecords} bản ghi.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}