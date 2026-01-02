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

    if (!area) {
      throw new NotFoundException(
        `선택하신 지역(코드: ${regionCode})의 기본 정보를 찾을 수 없습니다.`,
      );
    }

    const defaultSales = {
      thsmon_selng_amt: 0,
      mon_selng_amt: 0,
      tues_selng_amt: 0,
      wed_selng_amt: 0,
      thur_selng_amt: 0,
      fri_selng_amt: 0,
      sat_selng_amt: 0,
      sun_selng_amt: 0,
      tmzon_00_06_selng_amt: 0,
      tmzon_06_11_selng_amt: 0,
      tmzon_11_14_selng_amt: 0,
      tmzon_14_17_selng_amt: 0,
      tmzon_17_21_selng_amt: 0,
      tmzon_21_24_selng_amt: 0,
      ml_selng_amt: 0,
      fml_selng_amt: 0,
      agrde_10_selng_amt: 0,
      agrde_20_selng_amt: 0,
      agrde_30_selng_amt: 0,
      agrde_40_selng_amt: 0,
      agrde_50_selng_amt: 0,
      agrde_60_above_selng_amt: 0,
    };

    const activeSales = sales || defaultSales;

    const areaName = area.adstrd_nm || '알 수 없는 지역';
    const industryName = industry?.service_industry_nm || '전체 업종';

    // 1) 핵심 지표 계산
    const totalRevenue = Number(activeSales.thsmon_selng_amt);
    const storeCount = storeStats?.stor_co || 1;
    const avgRevenue = totalRevenue / storeCount;

    const days = [
      { name: '월', value: Number(activeSales.mon_selng_amt) },
      { name: '화', value: Number(activeSales.tues_selng_amt) },
      { name: '수', value: Number(activeSales.wed_selng_amt) },
      { name: '목', value: Number(activeSales.thur_selng_amt) },
      { name: '금', value: Number(activeSales.fri_selng_amt) },
      { name: '토', value: Number(activeSales.sat_selng_amt) },
      { name: '일', value: Number(activeSales.sun_selng_amt) },
    ];
    const peakDay = days.reduce(
      (prev, current) => (prev.value > current.value ? prev : current),
      days[0],
    ).name;

    const ages = [
      { name: '10대', value: Number(activeSales.agrde_10_selng_amt) },
      { name: '20대', value: Number(activeSales.agrde_20_selng_amt) },
      { name: '30대', value: Number(activeSales.agrde_30_selng_amt) },
      { name: '40대', value: Number(activeSales.agrde_40_selng_amt) },
      { name: '50대', value: Number(activeSales.agrde_50_selng_amt) },
      {
        name: '60대 이상',
        value: Number(activeSales.agrde_60_above_selng_amt),
      },
    ];
    const peakAgeGroup = ages.reduce(
      (prev, current) => (prev.value > current.value ? prev : current),
      ages[1],
    ).name;

    const competitionIntensity =
      storeCount > 100 ? 'High' : storeCount > 30 ? 'Medium' : 'Low';

    // 2) 상권 개요 (Heuristics based on peak data)
    const times = [
      { name: '00:00~06:00', value: Number(activeSales.tmzon_00_06_selng_amt) },
      { name: '06:00~11:00', value: Number(activeSales.tmzon_06_11_selng_amt) },
      { name: '11:00~14:00', value: Number(activeSales.tmzon_11_14_selng_amt) },
      { name: '14:00~17:00', value: Number(activeSales.tmzon_14_17_selng_amt) },
      { name: '17:00~21:00', value: Number(activeSales.tmzon_17_21_selng_amt) },
      { name: '21:00~24:00', value: Number(activeSales.tmzon_21_24_selng_amt) },
    ];
    const peakTime = times.reduce(
      (prev, current) => (prev.value > current.value ? prev : current),
      times[2],
    ).name;

    // 3) 고객 구성
    const maleRevenue = Number(activeSales.ml_selng_amt);
    const femaleRevenue = Number(activeSales.fml_selng_amt);
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
      meta: {
        generatedAt: new Date().toISOString().split('T')[0],
        category: industryName,
        region: areaName,
        radius: 500, // 기본값
        period: '최근 분기',
      },
      keyMetrics: {
        estimatedMonthlySales: {
          max: Math.floor(avgRevenue * 1.5),
        },
        wellDoingMonthlySales: {
          max: Math.floor(avgRevenue * 2.0),
        },
        floatingPopulation: {
          count: Number(footTraffic?.tot_flpop_co || 0),
          mainTime: peakTime,
        },
        mainVisitDays: {
          days: [peakDay],
          comment: `${peakDay}요일에 매출이 가장 집중됩니다.`,
        },
        coreCustomer: {
          ageGroup: peakAgeGroup,
          comment: `${peakAgeGroup} 고객의 구매력이 가장 높습니다.`,
        },
        competitionIntensity: {
          level:
            competitionIntensity === 'High'
              ? '높음'
              : competitionIntensity === 'Medium'
                ? '보통'
                : '낮음',
          comment: `주변에 동종 업종이 ${storeCount}개 있어 경쟁이 ${competitionIntensity === 'High' ? '치열함' : '완만함'}`,
        },
      },
      zoneOverview: {
        characteristics: `${areaName} 중심 상권`,
        visitMotivation: '식사 및 모임',
        peakTime,
        inflowPath: '대중교통 및 도보',
      },
      customerComposition: {
        malePercentage:
          totalGenderRevenue > 0 ? (maleRevenue / totalGenderRevenue) * 100 : 0,
        femalePercentage:
          totalGenderRevenue > 0
            ? (femaleRevenue / totalGenderRevenue) * 100
            : 0,
      },
      ageDistribution: {
        age10: this.calcRatio(Number(activeSales.agrde_10_selng_amt), ages),
        age20: this.calcRatio(Number(activeSales.agrde_20_selng_amt), ages),
        age30: this.calcRatio(Number(activeSales.agrde_30_selng_amt), ages),
        age40: this.calcRatio(Number(activeSales.agrde_40_selng_amt), ages),
        age50Plus: this.calcRatio(
          Number(activeSales.agrde_50_selng_amt) +
            Number(activeSales.agrde_60_above_selng_amt),
          ages,
        ),
      },
      summaryInsights: [
        {
          category: '패턴',
          content: `${peakTime} 시간대와 ${peakDay}요일에 유동이 집중되어 서비스 집중이 필요합니다.`,
          highlight: `${peakTime}`,
        },
        {
          category: '고객',
          content: `${peakAgeGroup} 비중이 높아 맞춤형 메뉴나 프로모션이 효과적입니다.`,
          highlight: `${peakAgeGroup}`,
        },
        {
          category: '상권',
          content: `경쟁 강도가 ${competitionIntensity === 'High' ? '높아' : '완만하여'} 차별화된 전략이 필요합니다.`,
          highlight: '차별화된 전략',
        },
      ],
      hourlyFlow: {
        summary:
          ftTimes[2].value > ftTimes[0].value
            ? '저녁 시간대 유동인구 집중'
            : '점심 시간대 유동인구 집중',
        data: [
          {
            timeRange: '11~14시',
            level: ftTimes[0].value > 50000 ? '높음' : '보통',
            intensity: ftTotal > 0 ? (ftTimes[0].value / ftTotal) * 100 : 0,
          },
          {
            timeRange: '14~17시',
            level: '낮음',
            intensity: ftTotal > 0 ? (ftTimes[1].value / ftTotal) * 100 : 0,
          },
          {
            timeRange: '17~21시',
            level: '피크',
            intensity: ftTotal > 0 ? (ftTimes[2].value / ftTotal) * 100 : 0,
          },
          {
            timeRange: '21~24시',
            level: '상승',
            intensity: ftTotal > 0 ? (ftTimes[3].value / ftTotal) * 100 : 0,
          },
        ],
      },
      weeklyCharacteristics: [
        {
          day: '월~목',
          characteristics:
            weekDayTraffic > 100000
              ? '직장인 중심 수요 활발'
              : '안정적 유동 유지',
        },
        {
          day: '금',
          characteristics:
            friTraffic > weekDayTraffic * 1.2
              ? '주말 전야 수요 급증'
              : '평시 수준 유지',
        },
        {
          day: '토',
          characteristics:
            satTraffic > weekDayTraffic * 1.5
              ? '외부 유입 최대'
              : '여가 중심 이동',
        },
        {
          day: '일',
          characteristics:
            sunTraffic < satTraffic
              ? '저녁 이후 유동 감소'
              : '오후 시간 수요 지속',
        },
      ],
      competitionAnalysis: [
        {
          category: '동종 업종 밀집',
          summary: `주변에 동종 업종 ${storeCount}개가 존재합니다.`,
          implication:
            competitionIntensity === 'High'
              ? '브랜드 차별화 필수'
              : '안정적 진입 가능',
        },
        {
          category: '가격대 경쟁',
          summary:
            avgIncome > 4000000
              ? '고소득층 다수 거주 상권입니다.'
              : '실속형 소비 중심 상권입니다.',
          implication:
            avgIncome > 4000000
              ? '프리미엄 전략 유효'
              : '가성비 위주 구성 제안',
        },
        {
          category: '연계 업종',
          summary: `주변 ${linkedIndustries} 업종이 활성화되어 있습니다.`,
          implication: '2차 소비 연계 마케팅 효과적',
        },
      ],
      conclusion: [
        {
          category: '운영',
          content: '피크 시간대 효율적인 인력 배치가 필요합니다.',
          highlight: '인력 배치',
        },
        {
          category: '상품',
          content: `${peakAgeGroup} 취향을 저격할 시그니처 메뉴 개발을 추천합니다.`,
          highlight: '시그니처 메뉴',
        },
        {
          category: '마케팅',
          content: `${peakDay}요일 매출 극대화를 위한 로컬 마케팅을 강화하세요.`,
          highlight: '로컬 마케팅',
        },
      ],
    };
  }

  private calcRatio(value: number, all: { value: number }[]): number {
    const total = all.reduce((sum, item) => sum + item.value, 0);
    return total > 0 ? (value / total) * 100 : 0;
  }
}
