"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, MapPin, Wifi, Briefcase, MessageSquareQuote, Clock4, ArrowRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AttendanceService from "@/services/attendance.services";
import { MapDialog } from "./components/map-dialog";

type Location = { lat: number; lng: number } | null;

interface UserInfo {
    _id: string;
    full_name: string;
    email: string;
    image_url: string | null;
}
interface Session {
    check_in_time?: string;
    check_out_time?: string;
    is_remote_check_in?: boolean;
    is_remote_check_out?: boolean;
    check_in_reason?: string | null;
    check_out_reason?: string | null;
    check_in_latitude?: number;
    check_in_longitude?: number;
    total_work_time?: string | null;
}
interface AttendanceRecord {
    _id: string;
    user_id: UserInfo;
    work_date: string;
    morning: Session;
    afternoon: Session;
    total_work_time?: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

function SessionCell({ session, onViewMap }: { session: Session, onViewMap: (location: Location) => void }) {
    const formatTime = (isoString?: string) => isoString ? format(new Date(isoString), 'HH:mm') : null;
    const checkInTime = formatTime(session.check_in_time);
    const checkOutTime = formatTime(session.check_out_time);

    const renderLocationButton = (lat?: number, lng?: number) => {
        if (!lat || !lng) return null;
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onViewMap({lat, lng})}>
                            <MapPin className="h-4 w-4 text-blue-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Xem vị trí trên bản đồ</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };
    
    const renderReasonTooltip = (reason?: string | null) => {
        if (!reason) return null;
        return (
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild><MessageSquareQuote className="h-4 w-4 text-gray-500 cursor-help" /></TooltipTrigger>
                    <TooltipContent><p>{reason}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", checkInTime ? 'bg-green-500' : 'bg-gray-300')}></span>
                <span className="w-12 font-semibold">Vào:</span>
                <span className="w-10">{checkInTime || "--:--"}</span>
                {checkInTime && (<Badge variant="outline" className="px-1.5 py-0.5">{session.is_remote_check_in ? <Wifi className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}</Badge>)}
                {renderReasonTooltip(session.check_in_reason)}
                {renderLocationButton(session.check_in_latitude, session.check_in_longitude)}
            </div>
            <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", checkOutTime ? 'bg-red-500' : 'bg-gray-300')}></span>
                <span className="w-12 font-semibold">Ra:</span>
                <span className="w-10">{checkOutTime || "--:--"}</span>
                 {checkOutTime && (<Badge variant="outline" className="px-1.5 py-0.5">{session.is_remote_check_out ? <Wifi className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}</Badge>)}
                {renderReasonTooltip(session.check_out_reason)}
            </div>
            <div className="flex items-center gap-1.5">
                 <Clock4 className="h-3 w-3 text-muted-foreground ml-0.5"/>
                 <span className="w-12 font-semibold">Giờ làm:</span>
                 <span className="font-bold">{session.total_work_time || "N/A"}</span>
            </div>
        </div>
    );
};

export default function TimekeepingPage() {
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [pagination, setPagination] = useState<{ currentPage: number; totalPages: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingLocation, setViewingLocation] = useState<Location>(null);

    const [keyword, setKeyword] = useState("");
    const [date, setDate] = useState<DateRange | undefined>({ from: new Date(), to: new Date() });
    const [currentPage, setCurrentPage] = useState(1);

    const debouncedKeyword = useDebounce(keyword, 500);

    const fetchAttendances = useCallback(async (page: number) => {
        setIsLoading(true);
        try {
            const payload = {
                searchCondition: {
                    keyword: debouncedKeyword,
                    date_from: date?.from ? format(date.from, 'yyyy-MM-dd') : "",
                    date_to: date?.to ? format(date.to, 'yyyy-MM-dd') : "",
                },
                pageInfo: { pageNum: page, pageSize: 10 },
            };
            const response = await AttendanceService.searchAttendances(payload);
            setAttendances(response.data.records);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu chấm công:", error);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedKeyword, date]);
    
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchAttendances(1);
        }
    }, [debouncedKeyword, date, fetchAttendances]);

    useEffect(() => {
        fetchAttendances(currentPage);
    }, [currentPage, fetchAttendances]);

    const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "NA";

    return (
      <>
        <Card>
            <CardHeader>
                <CardTitle>Báo cáo Chấm công</CardTitle>
                <CardDescription>Tra cứu và xem lịch sử chấm công của nhân viên.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <Input
                        placeholder="Tìm theo tên hoặc email nhân viên..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="flex-grow"
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-full md:w-[350px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "PP", { locale: vi })}
                                            <ArrowRight className="mx-2 h-4 w-4"/>
                                            {format(date.to, "PP", { locale: vi })}
                                        </>
                                    ) : (
                                        format(date.from, "PP", { locale: vi })
                                    )
                                ) : (
                                    <span>Chọn ngày</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={vi}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[25%]">Nhân viên</TableHead>
                                <TableHead>Ngày</TableHead>
                                <TableHead>Buổi sáng</TableHead>
                                <TableHead>Buổi chiều</TableHead>
                                <TableHead>Tổng giờ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}>
                                            <Skeleton className="h-20 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : attendances.length > 0 ? (
                                attendances.map(item => (
                                    <TableRow key={item._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={item.user_id.image_url ?? undefined} />
                                                    <AvatarFallback>{getInitials(item.user_id.full_name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{item.user_id.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.user_id.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(item.work_date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell><SessionCell session={item.morning} onViewMap={setViewingLocation} /></TableCell>
                                        <TableCell><SessionCell session={item.afternoon} onViewMap={setViewingLocation} /></TableCell>
                                        <TableCell className="font-bold text-base">{item.total_work_time || "N/A"}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Không có dữ liệu chấm công.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter>
                 {pagination && pagination.totalPages > 1 && (
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); if(currentPage > 1) setCurrentPage(currentPage - 1); }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            
                            <PaginationItem>
                                <span className="px-4 py-2 text-sm">Trang {pagination.currentPage}/{pagination.totalPages}</span>
                            </PaginationItem>
                            
                            <PaginationItem>
                                 <PaginationNext
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); if(currentPage < pagination.totalPages) setCurrentPage(currentPage + 1); }}
                                    className={currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                 )}
            </CardFooter>
        </Card>

        <MapDialog 
            isOpen={!!viewingLocation} 
            onOpenChange={() => setViewingLocation(null)}
            location={viewingLocation}
        />
      </>
    );
}