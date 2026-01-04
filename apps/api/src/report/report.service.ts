import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { SummaryReportResponse } from './dto/summary-report.dto';

@Injectable()
export class ReportService {
  constructor(private readonly repository: ReportRepository) {}

  async getSummaryReport(
    regionCode: string,
    industryCode: string,
    fallbackIndustryName?: string,
    fallbackRegionName?: string,
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
    const areaName = area?.adstrd_nm || fallbackRegionName || '데이터 부족';

    // 업종명 결정: service_industry 테이블 -> 매출 데이터 -> 프론트엔드 전달값 -> 코드값
    const industryName =
      industry?.service_industry_nm ||
      (sales as { svc_induty_cd_nm: string } | null)?.svc_induty_cd_nm ||
      fallbackIndustryName ||
      industryCode;

    // 1) 핵심 지표 계산
    const totalRevenue = Number(activeSales.thsmon_selng_amt);
    const storeCount = storeStats?.stor_co || 0;
    // thsmon_selng_amt는 분기 매출이므로 3으로 나누어 월 평균 매출 계산
    const avgRevenue = totalRevenue / (storeCount || 1) / 3;

    const days = [
      { name: '월', value: Number(activeSales.mon_selng_amt) },
      { name: '화', value: Number(activeSales.tues_selng_amt) },
      { name: '수', value: Number(activeSales.wed_selng_amt) },
      { name: '목', value: Number(activeSales.thur_selng_amt) },
      { name: '금', value: Number(activeSales.fri_selng_amt) },
      { name: '토', value: Number(activeSales.sat_selng_amt) },
      { name: '일', value: Number(activeSales.sun_selng_amt) },
    ];
    const peakDayItem = days.reduce(
      (prev, current) => (prev.value > current.value ? prev : current),
      days[0],
    );
    const peakDay = peakDayItem.value > 0 ? peakDayItem.name : '데이터 부족';

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

    const peakAgeGroupItem = ages.reduce(
      (prev, current) => (prev.value > current.value ? prev : current),
      ages[2],
    );
    const peakAgeGroup =
      peakAgeGroupItem.value > 0 ? peakAgeGroupItem.name : '데이터 부족';

    const competitionIntensity =
      storeCount > 100
        ? 'High'
        : storeCount > 30
          ? 'Medium'
          : storeCount > 0
            ? 'Low'
            : 'None';

    // 2) 상권 개요 (Derived from data where possible)
    const times = [
      { name: '00:00~06:00', value: Number(activeSales.tmzon_00_06_selng_amt) },
      { name: '06:00~11:00', value: Number(activeSales.tmzon_06_11_selng_amt) },
      { name: '11:00~14:00', value: Number(activeSales.tmzon_11_14_selng_amt) },
      { name: '14:00~17:00', value: Number(activeSales.tmzon_14_17_selng_amt) },
      { name: '17:00~21:00', value: Number(activeSales.tmzon_17_21_selng_amt) },
      { name: '21:00~24:00', value: Number(activeSales.tmzon_21_24_selng_amt) },
    ];
    const peakTimeItem = times.reduce(
      (prev, current) => (prev.value > current.value ? prev : current),
      times[2],
    );
    const peakTime = peakTimeItem.value > 0 ? peakTimeItem.name : '데이터 부족';

    // 3) 고객 구성
    const maleRevenue = Number(activeSales.ml_selng_amt);
    const femaleRevenue = Number(activeSales.fml_selng_amt);
    const totalGenderRevenue = maleRevenue + femaleRevenue;

    const rawMalePercentage =
      totalGenderRevenue > 0 ? (maleRevenue / totalGenderRevenue) * 100 : 0;
    const malePercentage = Number(rawMalePercentage.toFixed(1));
    const femalePercentage =
      totalGenderRevenue > 0 ? Number((100 - malePercentage).toFixed(1)) : 0;

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

    // 4) 연령대 분포 계산 및 보정 (합계 100% 보장)
    const ageAges = [
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
    const age10 = Number(
      this.calcRatio(Number(activeSales.agrde_10_selng_amt), ageAges).toFixed(
        1,
      ),
    );
    const age20 = Number(
      this.calcRatio(Number(activeSales.agrde_20_selng_amt), ageAges).toFixed(
        1,
      ),
    );
    const age30 = Number(
      this.calcRatio(Number(activeSales.agrde_30_selng_amt), ageAges).toFixed(
        1,
      ),
    );
    const age40 = Number(
      this.calcRatio(Number(activeSales.agrde_40_selng_amt), ageAges).toFixed(
        1,
      ),
    );
    const age50Plus = Number(
      (100 - (age10 + age20 + age30 + age40)).toFixed(1),
    );

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
          max: avgRevenue > 0 ? Math.floor(avgRevenue * 1.5) : 0,
        },
        wellDoingMonthlySales: {
          max: avgRevenue > 0 ? Math.floor(avgRevenue * 2.0) : 0,
        },
        floatingPopulation: {
          count: Number(footTraffic?.tot_flpop_co || 0),
          mainTime: peakTime,
        },
        mainVisitDays: {
          days: peakDay !== '데이터 부족' ? [peakDay] : [],
          comment:
            peakDay !== '데이터 부족'
              ? `${peakDay}요일에 매출이 가장 집중됩니다.`
              : '데이터 부족',
        },
        coreCustomer: {
          ageGroup: peakAgeGroup,
          comment:
            peakAgeGroup !== '데이터 부족'
              ? `${peakAgeGroup} 고객의 구매력이 가장 높습니다.`
              : '데이터 부족',
        },
        competitionIntensity: {
          level:
            competitionIntensity === 'High'
              ? '높음'
              : competitionIntensity === 'Medium'
                ? '보통'
                : competitionIntensity === 'Low'
                  ? '낮음'
                  : '데이터 부족',
          comment:
            competitionIntensity !== 'None'
              ? `주변에 동종 업종이 ${storeCount}개 있어 경쟁이 ${competitionIntensity === 'High' ? '치열함' : '완만함'}`
              : '데이터 부족',
        },
      },
      zoneOverview: {
        characteristics:
          areaName !== '데이터 부족' ? `${areaName} 상권` : '데이터 부족',
        visitMotivation:
          peakTime !== '데이터 부족' ? `${peakTime} 중심 소비` : '데이터 부족',
        peakTime,
        inflowPath:
          peakTime !== '데이터 부족' ? '지역내 유동 중심' : '데이터 부족',
      },
      customerComposition: {
        malePercentage,
        femalePercentage,
      },
      ageDistribution: {
        age10,
        age20,
        age30,
        age40,
        age50Plus,
      },
      summaryInsights: [
        {
          category: '패턴',
          content:
            peakTime !== '데이터 부족' && peakDay !== '데이터 부족'
              ? `${peakTime} 시간대와 ${peakDay}요일에 매출이 집중되어 효율적인 운영이 필요합니다.`
              : '데이터 부족',
          highlight: peakTime !== '데이터 부족' ? peakTime : '',
        },
        {
          category: '고객',
          content:
            peakAgeGroup !== '데이터 부족'
              ? `${peakAgeGroup} 비중이 높아 해당 연령층을 겨냥한 맞춤 전략이 효과적입니다.`
              : '데이터 부족',
          highlight: peakAgeGroup !== '데이터 부족' ? peakAgeGroup : '',
        },
        {
          category: '상권',
          content:
            competitionIntensity !== 'None'
              ? `경쟁 강도가 ${competitionIntensity === 'High' ? '높은 편이므로' : '완만하여'} 차별화된 경쟁력 확보가 중요합니다.`
              : '데이터 부족',
          highlight: '차별화된 경쟁력',
        },
      ],
      hourlyFlow: {
        summary:
          ftTotal > 0
            ? ftTimes[2].value > ftTimes[0].value
              ? '저녁 시간대 유동인구 집중'
              : '점심 시간대 유동인구 집중'
            : '데이터 부족',
        data: [
          {
            timeRange: '11~14시',
            level:
              ftTimes[0].value > 50000
                ? '높음'
                : ftTimes[0].value > 0
                  ? '보통'
                  : '데이터 부족',
            intensity: ftTotal > 0 ? (ftTimes[0].value / ftTotal) * 100 : 0,
          },
          {
            timeRange: '14~17시',
            level: ftTimes[1].value > 0 ? '보통' : '데이터 부족',
            intensity: ftTotal > 0 ? (ftTimes[1].value / ftTotal) * 100 : 0,
          },
          {
            timeRange: '17~21시',
            level: ftTimes[2].value > 0 ? '피크' : '데이터 부족',
            intensity: ftTotal > 0 ? (ftTimes[2].value / ftTotal) * 100 : 0,
          },
          {
            timeRange: '21~24시',
            level: ftTimes[3].value > 0 ? '보통' : '데이터 부족',
            intensity: ftTotal > 0 ? (ftTimes[3].value / ftTotal) * 100 : 0,
          },
        ],
      },
      weeklyCharacteristics: [
        {
          day: '월~목',
          characteristics:
            footTraffic && weekDayTraffic > 100000
              ? '직장인 중심 수요 활발'
              : footTraffic && weekDayTraffic > 0
                ? '안정적 유동 유지'
                : '데이터 부족',
        },
        {
          day: '금',
          characteristics:
            footTraffic && friTraffic > weekDayTraffic * 1.2
              ? '주말 전야 수요 급증'
              : footTraffic && friTraffic > 0
                ? '평시 수준 유지'
                : '데이터 부족',
        },
        {
          day: '토',
          characteristics:
            footTraffic && satTraffic > weekDayTraffic * 1.5
              ? '외부 유입 최대'
              : footTraffic && satTraffic > 0
                ? '여가 중심 이동'
                : '데이터 부족',
        },
        {
          day: '일',
          characteristics:
            footTraffic && sunTraffic > 0
              ? sunTraffic < satTraffic
                ? '저녁 이후 유동 감소'
                : '오후 시간 수요 지속'
              : '데이터 부족',
        },
      ],
      competitionAnalysis: [
        {
          category: '동종 업종 밀집',
          summary: sales
            ? `주변에 동종 업종 ${storeCount}개가 존재합니다.`
            : '데이터 부족',
          implication:
            sales && competitionIntensity === 'High'
              ? '브랜드 차별화 필수'
              : sales && competitionIntensity !== 'None'
                ? '안정적 진입 가능'
                : '데이터 부족',
        },
        {
          category: '가격대 경쟁',
          summary:
            income && avgIncome > 4000000
              ? '고소득층 다수 거주 상권입니다.'
              : income && avgIncome > 0
                ? '실속형 소비 중심 상권입니다.'
                : '데이터 부족',
          implication:
            income && avgIncome > 4000000
              ? '프리미엄 전략 유효'
              : income && avgIncome > 0
                ? '가성비 위주 구성 제안'
                : '데이터 부족',
        },
        {
          category: '연계 업종',
          summary:
            topIndustries.length > 0
              ? `주변 ${linkedIndustries} 업종이 활성화되어 있습니다.`
              : '데이터 부족',
          implication:
            topIndustries.length > 0
              ? '2차 소비 연계 마케팅 효과적'
              : '데이터 부족',
        },
      ],
      conclusion: [
        {
          category: '운영',
          content:
            peakTime !== '데이터 부족'
              ? `${peakTime} 시간대 효율적인 인력 배치가 필요합니다.`
              : '데이터 부족',
          highlight: '인력 배치',
        },
        {
          category: '상품',
          content:
            peakAgeGroup !== '데이터 부족'
              ? `${peakAgeGroup} 취향을 저격할 시그니처 메뉴 개발을 추천합니다.`
              : '데이터 부족',
          highlight: '시그니처 메뉴',
        },
        {
          category: '마케팅',
          content:
            peakDay !== '데이터 부족'
              ? `${peakDay}요일 매출 극대화를 위한 로컬 마케팅을 강화하세요.`
              : '데이터 부족',
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
