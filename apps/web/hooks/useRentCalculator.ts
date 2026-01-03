import { useState } from 'react';

export interface RentData {
  region: string;
  size: number; // m2
  floor: number;
  type: string; // 'small' | 'mediumLarge' | 'aggregate'
}

export interface RentResult {
  deposit: number;
  monthlyRent: number;
  unitPrice: number; // m2 price
  pricePer3_3m2: number; // 3.3m2 (Pyeong) price
}

export const useRentCalculator = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RentData>({
    region: '',
    size: 0,
    floor: 1,
    type: '',
  });
  const [result, setResult] = useState<RentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [rentOptions, setRentOptions] = useState<{
    small: number | null;
    mediumLarge: number | null;
    aggregate: number | null;
  } | null>(null);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => Math.max(0, prev - 1));

  const updateData = (newData: Partial<RentData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const fetchRentInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:4000/rent/info?gu=${data.region}&floor=${data.floor}`,
      );
      if (!response.ok) throw new Error('Failed to fetch rent info');
      const apiData = await response.json();

      // Store raw data (unit: 1000 KRW / Pyeong)
      setRentOptions({
        small: apiData.small ? Number(apiData.small) : null,
        mediumLarge: apiData.mediumLarge ? Number(apiData.mediumLarge) : null,
        aggregate: apiData.aggregate ? Number(apiData.aggregate) : null,
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRent = () => {
    if (!rentOptions) return;

    let unitPrice = 0;
    if (data.type === 'small') unitPrice = rentOptions.small || 0;
    else if (data.type === 'mediumLarge')
      unitPrice = rentOptions.mediumLarge || 0;
    else if (data.type === 'aggregate') unitPrice = rentOptions.aggregate || 0;

    // Calculation Logic
    const PYEONG_CONVERSION = 3.3058;
    const UNIT_MULTIPLIER = 1000;

    const pricePerPyeong = unitPrice * UNIT_MULTIPLIER;
    const pricePerMeter = pricePerPyeong / PYEONG_CONVERSION;
    const monthlyRent = pricePerMeter * data.size;
    const deposit = monthlyRent * 10;

    setResult({
      unitPrice: Math.round(pricePerMeter),
      pricePer3_3m2: Math.round(pricePerPyeong),
      monthlyRent: Math.round(monthlyRent),
      deposit: Math.round(deposit),
    });
  };

  return {
    step,
    data,
    result,
    rentOptions, // Expose options
    isLoading,
    nextStep,
    prevStep,
    updateData,
    fetchRentInfo, // Expose fetcher
    calculateRent,
  };
};
