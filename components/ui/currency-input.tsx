// components/ui/currency-input.tsx

import * as React from "react";
import { Input } from "@/components/ui/input";

// Hàm format số thành tiền VNĐ
const formatCurrency = (value: number | string) => {
  const numericValue = Number(String(value).replace(/[^0-9]/g, ""));
  if (isNaN(numericValue) || numericValue === 0) return "";
  return new Intl.NumberFormat("vi-VN").format(numericValue);
};

// Hàm lấy số từ chuỗi đã format
const parseCurrency = (value: string) => {
  return Number(value.replace(/[^0-9]/g, ""));
};

// LỖI GỐC Ở DÒNG NÀY: Mày đã dùng `InputProps` không tồn tại
// export interface CurrencyInputProps extends Omit<InputProps, "onChange" | "value"> {

// SỬA THÀNH DÒNG NÀY: Dùng trực tiếp type từ React
export interface CurrencyInputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "onChange" | "value"> {
  value: number;
  onValueChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    
    // State để giữ giá trị hiển thị trên UI
    const [displayValue, setDisplayValue] = React.useState(() => formatCurrency(value));

    // Xử lý khi người dùng gõ
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const numericValue = parseCurrency(rawValue);

      // Cập nhật giá trị hiển thị ngay lập tức
      setDisplayValue(formatCurrency(numericValue));
      
      // Báo cho react-hook-form giá trị số thực
      onValueChange(numericValue);
    };

    // Cập nhật lại UI nếu giá trị từ form thay đổi từ bên ngoài
    React.useEffect(() => {
        const formatted = formatCurrency(value);
        // So sánh giá trị số thay vì chuỗi đã format để tránh re-render vô tận
        if (parseCurrency(displayValue) !== value) {
            setDisplayValue(formatted);
        }
    }, [value, displayValue]);


    return (
        <Input
            {...props}
            ref={ref}
            value={displayValue}
            onChange={handleChange}
            placeholder="0"
            // Đảm bảo chỉ nhập được số
            onKeyDown={(e) => {
                if (!/[0-9]|Backspace|Tab|Enter|ArrowLeft|ArrowRight|Delete|F5/.test(e.key)) {
                    e.preventDefault();
                }
            }}
        />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };