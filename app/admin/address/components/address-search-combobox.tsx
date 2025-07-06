"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import OpenMapService, { PlaceDetailsGoogle, AutocompletePrediction } from "@/services/openmap.services";

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

interface AddressSearchInputProps {
  onAddressSelect: (place: PlaceDetailsGoogle) => void;
}

export function AddressSearchInput({ onAddressSelect }: AddressSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isListVisible, setIsListVisible] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const sessionToken = useMemo(() => crypto.randomUUID(), []);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedSearchQuery) {
      setPredictions([]);
      return;
    }
    const fetchPredictions = async () => {
      try {
        const response = await OpenMapService.autocomplete(debouncedSearchQuery, sessionToken);
        setPredictions(response.predictions || []);
        setIsListVisible(true);
      } catch (error) { console.error("Lỗi autocomplete:", error); }
    };
    fetchPredictions();
  }, [debouncedSearchQuery, sessionToken]);

  // Bắt sự kiện click ra ngoài để ẩn danh sách gợi ý
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsListVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [commandRef]);


  const handleSelect = async (placeId: string) => {
    try {
        const response = await OpenMapService.getPlaceDetailsGoogleFormat(placeId, sessionToken);
        if (response.result) {
            onAddressSelect(response.result);
            setSearchQuery(response.result.formatted_address); // Cập nhật lại input với địa chỉ đầy đủ
        }
        setIsListVisible(false);
    } catch (error) { console.error("Lỗi lấy chi tiết địa điểm:", error); }
  };

  return (
    <Command ref={commandRef} className="relative overflow-visible">
      <CommandInput
        placeholder="Nhập địa chỉ để tìm kiếm..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        onFocus={() => setIsListVisible(true)}
      />
      {isListVisible && predictions.length > 0 && (
        <CommandList className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <CommandEmpty>Không tìm thấy địa điểm.</CommandEmpty>
          <CommandGroup>
            {predictions.map((prediction) => (
              <CommandItem
                key={prediction.place_id}
                value={prediction.description}
                onSelect={() => handleSelect(prediction.place_id)}
              >
                <p className="text-sm">{prediction.description}</p>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}