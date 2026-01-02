import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { SummaryReportResponse } from './dto/summary-report.dto';

@Injectable()
export class ReportService {
  constructor(private readonly repository: ReportRepository) {}

  async getSummaryReport(
    regionCode: string,
    industryCode: string,
  ): Promise<SummaryReportResponse> {
    const [
      sales,
      footTraffic,
      storeStats,
      area,
      industry,
      income,
      topIndustries,
    ] = await Promise.all([
      this.repository.getLatestSales(regionCode, industryCode),
      this.repository.getLatestFootTraffic(regionCode),
      this.repository.getStoreDensity(regionCode, industryCode),
      this.repository.getAreaName(regionCode),
      this.repository.getIndustryName(industryCode),
      this.repository.getLatestIncome(regionCode),
      this.repository.getTopIndustriesInArea(regionCode),
    ]);

    if (!sales || !area) {
      throw new NotFoundException(
        'Data not found for the selected region or industry',
      );
    }

    const areaName = area.adstrd_nm;
    const industryName = industry?.service_industry_nm || '전체 업종';

    // 1) 핵심 지표 계산
    const totalRevenue = Number(sales.thsmon_selng_amt);
    const storeCount = storeStats?.stor_co || 1;
    const avgRevenue = totalRevenue / storeCount;

    const days = [
      { name: '월', value: Number(sales.mon_selng_amt) },
      { name: '화', value: Number(sales.tues_selng_amt) },
      { name: '수', value: Number(sales.wed_selng_amt) },
      { name: '목', value: Number(sales.thur_selng_amt) },
      { name: '금', value: Number(sales.fri_selng_amt) },
      { name: '토', value: Number(sales.sat_selng_amt) },
      { name: '일', value: Number(sales.sun_selng_amt) },
    ];
    const peakDay = days.reduce((prev, current) =>
      prev.value > current.value ? prev : current,
    ).name;

    const ages = [
      { name: '10대', value: Number(sales.agrde_10_selng_amt) },
      { name: '20대', value: Number(sales.agrde_20_selng_amt) },
      { name: '30대', value: Number(sales.agrde_30_selng_amt) },
      { name: '40대', value: Number(sales.agrde_40_selng_amt) },
      { name: '50대', value: Number(sales.agrde_50_selng_amt) },
      { name: '60대 이상', value: Number(sales.agrde_60_above_selng_amt) },
    ];
    const peakAgeGroup = ages.reduce((prev, current) =>
      prev.value > current.value ? prev : current,
    ).name;

    const competitionIntensity =
      storeCount > 100 ? 'High' : storeCount > 30 ? 'Medium' : 'Low';

    // 2) 상권 개요 (Heuristics based on peak data)
    const times = [
      { name: '00:00~06:00', value: Number(sales.tmzon_00_06_selng_amt) },
      { name: '06:00~11:00', value: Number(sales.tmzon_06_11_selng_amt) },
      { name: '11:00~14:00', value: Number(sales.tmzon_11_14_selng_amt) },
      { name: '14:00~17:00', value: Number(sales.tmzon_14_17_selng_amt) },
      { name: '17:00~21:00', value: Number(sales.tmzon_17_21_selng_amt) },
      { name: '21:00~24:00', value: Number(sales.tmzon_21_24_selng_amt) },
    ];
    const peakTime = times.reduce((prev, current) =>
      prev.value > current.value ? prev : current,
    ).name;

    // 3) 고객 구성
    const maleRevenue = Number(sales.ml_selng_amt);
    const femaleRevenue = Number(sales.fml_selng_amt);
    const totalGenderRevenue = maleRevenue + femaleRevenue;

    // 6) 시간대별 유동 (Foot Traffic Detail)
    const ftTimes = [
      {
        name: '11~14시',
        value: Number(footTraffic?.tmzon_11_14_flpop_co || 0),
      },
      {
        name: '14~17시',
        value: Number(footTraffic?.tmzon_14_17_flpop_co || 0),
      },
      {
        name: '17~21시',
        value: Number(footTraffic?.tmzon_17_21_flpop_co || 0),
      },
      {
        name: '21~24시',
        value: Number(footTraffic?.tmzon_21_24_flpop_co || 0),
      },
    ];
    const ftTotal = ftTimes.reduce((sum, t) => sum + t.value, 0);

    // 7) 요일별 특성
    const weekDayTraffic =
      (Number(footTraffic?.mon_flpop_co || 0) +
        Number(footTraffic?.tues_flpop_co || 0) +
        Number(footTraffic?.wed_flpop_co || 0) +
        Number(footTraffic?.thur_flpop_co || 0)) /
      4;
    const friTraffic = Number(footTraffic?.fri_flpop_co || 0);
    const satTraffic = Number(footTraffic?.sat_flpop_co || 0);
    const sunTraffic = Number(footTraffic?.sun_flpop_co || 0);

    // 8) 경쟁/상권 구조
    const avgIncome = income?.mt_avrg_income_amt || 0;
    const linkedIndustries = topIndustries
      .filter((i) => i.svc_induty_cd_nm !== industryName)
      .slice(0, 3)
      .map((i) => i.svc_induty_cd_nm)
      .join(', ');

    return {
      areaName,
      industryName,
      generatedDate: new Date().toISOString().split('T')[0],
      keyIndicators: {
        monthlyRevenue: {
          conservative: Math.floor(avgRevenue * 0.8),
          optimal: Math.floor(avgRevenue * 1.5),
        },
        estimatedFootTraffic: Number(footTraffic?.tot_flpop_co || 0),
        peakDay,
        peakAgeGroup,
        competitionIntensity,
      },
      marketOverview: {
        characteristics: `${areaName} 중심 상권`,
        visitMotivation: '식사 및 모임',
        peakTime,
        inflowPath: '대중교통 및 도보',
      },
      genderDistribution: {
        male:
          totalGenderRevenue > 0 ? (maleRevenue / totalGenderRevenue) * 100 : 0,
        female:
          totalGenderRevenue > 0
            ? (femaleRevenue / totalGenderRevenue) * 100
            : 0,
        interpretation:
          maleRevenue > femaleRevenue
            ? '남성 고객 비중이 소폭 높음'
            : '여성 고객 비중이 소폭 높음',
      },
      ageDistribution: {
        age10: this.calcRatio(Number(sales.agrde_10_selng_amt), ages),
        age20: this.calcRatio(Number(sales.agrde_20_selng_amt), ages),
        age30: this.calcRatio(Number(sales.agrde_30_selng_amt), ages),
        age40: this.calcRatio(Number(sales.agrde_40_selng_amt), ages),
        age50plus: this.calcRatio(
          Number(sales.agrde_50_selng_amt) +
            Number(sales.agrde_60_above_selng_amt),
          ages,
        ),
      },
      timeBasedFootTraffic: {
        time11_14: ftTotal > 0 ? (ftTimes[0].value / ftTotal) * 100 : 0,
        time14_17: ftTotal > 0 ? (ftTimes[1].value / ftTotal) * 100 : 0,
        time17_21: ftTotal > 0 ? (ftTimes[2].value / ftTotal) * 100 : 0,
        time21_24: ftTotal > 0 ? (ftTimes[3].value / ftTotal) * 100 : 0,
        interpretation:
          ftTimes[2].value > ftTimes[0].value
            ? '저녁 시간대 유동인구 집중'
            : '점심 시간대 유동인구 집중',
      },
      dayOfWeekCharacteristics: {
        weekday:
          weekDayTraffic > 100000
            ? '직장인 중심 수요 활발'
            : '안정적 유동 유지',
        friday:
          friTraffic > weekDayTraffic * 1.2
            ? '주말 전야 수요 급증'
            : '평시 수준 유지',
        saturday:
          satTraffic > weekDayTraffic * 1.5
            ? '외부 유입 최대'
            : '여가 중심 이동',
        sunday:
          sunTraffic < satTraffic
            ? '저녁 이후 유동 감소'
            : '오후 시간 수요 지속',
      },
      competitionStructure: {
        density: {
          summary: `동종 업종 ${storeCount}개 밀집`,
          insight:
            competitionIntensity === 'High'
              ? '브랜드 차별화 필수'
              : '안정적 진입 가능',
        },
        priceCompetition: {
          summary:
            avgIncome > 4000000 ? '고소득층 다수 거주' : '실속형 소비 중심',
          insight:
            avgIncome > 4000000
              ? '프리미엄 전략 유효'
              : '가성비 위주 구성 제안',
        },
        inflowPath: {
          summary: '도보 이동 및 지하철 인접',
          insight: '간판 및 입구 시인성 확보 중요',
        },
        linkedIndustries: {
          summary: `주변 ${linkedIndustries} 연계`,
          insight: '2차 소비 연계 마케팅 효과적',
        },
      },
    };
  }

  private calcRatio(value: number, all: { value: number }[]): number {
    const total = all.reduce((sum, item) => sum + item.value, 0);
    return total > 0 ? (value / total) * 100 : 0;
  }
}
