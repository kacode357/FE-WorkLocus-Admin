"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ReviewService from "@/services/review.services";
import BonusService from "@/services/bonus.services";

// Định nghĩa kiểu
export interface Review {
  grade: string;
  notes: string;
}
interface ReviewManagerProps {
  userId: string;
  month: number;
  year: number;
  onReviewComplete: (review: Review) => void;
}

const formSchema = z.object({
  grade: z.string({ required_error: "Vui lòng chọn xếp loại." }),
  notes: z.string().min(5, "Ghi chú phải có ít nhất 5 ký tự."),
});

export function ReviewManager({ userId, month, year, onReviewComplete }: ReviewManagerProps) {
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [bonusGrades, setBonusGrades] = useState<{ grade: string, description: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { grade: undefined, notes: "" },
  });
  
  useEffect(() => {
    // Reset khi đổi user hoặc tháng/năm
    setIsLoading(true);
    setExistingReview(null);
    form.reset();

    const checkReview = async () => {
      try {
        const [reviewResponse, bonusResponse] = await Promise.all([
          ReviewService.getReviews({ user_id: userId, month, year, pageNum: 1, pageSize: 1 }),
          BonusService.searchBonuses({ searchCondition: { keyword: "" }, pageInfo: { pageNum: 1, pageSize: 50 } })
        ]);
        
        if (bonusResponse.data.records) {
            setBonusGrades(bonusResponse.data.records);
        }

        if (reviewResponse.data.records.length > 0) {
          const foundReview = reviewResponse.data.records[0];
          setExistingReview(foundReview);
          onReviewComplete(foundReview); // Có rồi thì báo cho trang cha biết luôn
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra đánh giá:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkReview();
  }, [userId, month, year, form, onReviewComplete]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const response = await ReviewService.createOrUpdateReview({ ...data, user_id: userId, month, year });
      toast.success("Tạo đánh giá thành công.");
      setExistingReview(response.data);
      onReviewComplete(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tạo đánh giá.");
    }
  };
  
  if (isLoading) {
    return <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>;
  }

  if (existingReview) {
    return (
      <Card className="bg-muted/30">
        <CardHeader><CardTitle>Đánh giá tháng {month}/{year}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
            <div className="flex items-center gap-4"><strong>Xếp loại:</strong> <Badge className="text-lg px-3 py-1">{existingReview.grade}</Badge></div>
            <div><strong>Ghi chú:</strong> <p className="text-sm text-muted-foreground">{existingReview.notes}</p></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo đánh giá tháng {month}/{year}</CardTitle>
        <CardDescription>Nhân viên này chưa có đánh giá. Vui lòng tạo một đánh giá.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="grade" render={({ field }) => (
              <FormItem><FormLabel>Xếp loại</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Chọn xếp loại..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {bonusGrades.map(bg => <SelectItem key={bg.grade} value={bg.grade}>{bg.grade} - {bg.description}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Ghi chú</FormLabel><FormControl><Textarea placeholder="Nhận xét về hiệu suất..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={form.formState.isSubmitting}>Lưu đánh giá</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}