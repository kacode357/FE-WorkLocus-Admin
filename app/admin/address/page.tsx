"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

import { getWorkplacesApi, updateWorkplaceApi } from "@/services/admin.services";
// SỬA LẠI ĐÂY: Import component mới
import { AddressSearchInput } from "./components/address-search-combobox";
import { PlaceDetailsGoogle } from "@/services/openmap.services";

const formSchema = z.object({
    name: z.string().min(5, "Tên/Địa chỉ phải có ít nhất 5 ký tự."),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddressPage() {
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", latitude: 0, longitude: 0 },
  });

  useEffect(() => {
    const fetchWorkplace = async () => {
      setIsLoading(true);
      try {
        const response = await getWorkplacesApi();
        if (response.ok && response.data) {
          form.reset(response.data);
        }
      } catch (err) {
        toast.error("Không thể tải dữ liệu địa điểm hiện tại.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkplace();
  }, [form]);

  const handleAddressSelect = (place: PlaceDetailsGoogle) => {
    form.setValue("name", place.formatted_address, { shouldValidate: true });
    form.setValue("latitude", place.geometry.location.lat, { shouldValidate: true });
    form.setValue("longitude", place.geometry.location.lng, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    try {
        await updateWorkplaceApi(data);
        toast.success("Cập nhật địa chỉ thành công!");
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi khi cập nhật địa chỉ.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Địa chỉ</h1>
        <p className="text-muted-foreground">Cập nhật địa chỉ làm việc chính của công ty.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Cập nhật Địa chỉ</CardTitle>
              <CardDescription>Tìm kiếm địa chỉ mới để tự động điền kinh độ, vĩ độ hoặc chỉnh sửa thủ công.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* SỬA LẠI ĐÂY: Dùng component mới */}
                <div className="space-y-2">
                    <Label>Tìm kiếm địa chỉ mới</Label>
                    <AddressSearchInput onAddressSelect={handleAddressSelect} />
                </div>

                <Separator />
              
                {isLoading ? (
                    <div className="space-y-6 pt-2">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Tên/Địa chỉ đầy đủ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="latitude" render={({ field }) => (
                                <FormItem><FormLabel>Vĩ độ (Latitude)</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="longitude" render={({ field }) => (
                                <FormItem><FormLabel>Kinh độ (Longitude)</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Lưu thay đổi
                 </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}