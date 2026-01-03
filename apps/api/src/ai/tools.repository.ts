import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type AreaQueryParams = {
  stdrYyquCd: string;
  areaCd: string;
};

@Injectable()
export class ToolsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 2) 상권 기본 요약(간단): 유동/상주/직장/매출/점포 (업종 합계 기준)
  async getCommercialSummary(params: AreaQueryParams) {
    const { stdrYyquCd, areaCd } = params;
    const rows = await this.prisma.$queryRaw<any[]>`
      WITH
      sales_sum AS (
        SELECT
          stdr_yyqu_cd,
          area_level,
          area_cd,
          area_nm,
          trdar_se_cd,
          trdar_se_cd_nm,
          SUM(thsmon_selng_amt) AS thsmon_selng_amt,
          SUM(thsmon_selng_co) AS thsmon_selng_co,
          SUM(mdwk_selng_amt) AS mdwk_selng_amt,
          SUM(wkend_selng_amt) AS wkend_selng_amt
        FROM v_sales
        WHERE stdr_yyqu_cd = ${stdrYyquCd}
          AND area_cd = ${areaCd}
        GROUP BY 1, 2, 3, 4, 5, 6
      ),
      store_sum AS (
        SELECT
          stdr_yyqu_cd,
          area_level,
          area_cd,
          area_nm,
          trdar_se_cd,
          trdar_se_cd_nm,
          SUM(stor_co) AS stor_co,
          SUM(similr_induty_stor_co) AS similr_induty_stor_co,
          SUM(frc_stor_co) AS frc_stor_co
        FROM v_store
        WHERE stdr_yyqu_cd = ${stdrYyquCd}
          AND area_cd = ${areaCd}
        GROUP BY 1, 2, 3, 4, 5, 6
      )
      SELECT
        sales_sum.stdr_yyqu_cd AS "매출 기준 년분기 코드",
        sales_sum.area_level AS "지역 수준",
        sales_sum.area_cd AS "지역 코드",
        sales_sum.area_nm AS "지역 이름",
        sales_sum.trdar_se_cd AS "상권 구분 코드",
        sales_sum.trdar_se_cd_nm AS "상권 구분 코드 명",
        ft.tot_flpop_co AS "총 유동인구",
        rp.tot_repop_co AS "총 상주인구",
        wp.tot_wrc_popltn_co AS "총 직장인구",
        sales_sum.thsmon_selng_amt AS "해당 분기 매출 금액",
        sales_sum.thsmon_selng_co AS "해당 분기 매출 건수",
        sales_sum.mdwk_selng_amt AS "주중 매출 금액",
        sales_sum.wkend_selng_amt AS "주말 매출 금액",
        store_sum.stor_co AS "점포 수",
        store_sum.similr_induty_stor_co AS "유사 업종 점포 수",
        store_sum.frc_stor_co AS "프랜차이즈 점포 수"
      FROM sales_sum
      LEFT JOIN v_foot_traffic ft
        ON ft.stdr_yyqu_cd = sales_sum.stdr_yyqu_cd
      AND ft.area_level = sales_sum.area_level
      AND ft.area_cd = sales_sum.area_cd
      AND ft.area_nm = sales_sum.area_nm
      AND ft.trdar_se_cd = sales_sum.trdar_se_cd
      AND ft.trdar_se_cd_nm = sales_sum.trdar_se_cd_nm
      LEFT JOIN v_resident_population rp
        ON rp.stdr_yyqu_cd = sales_sum.stdr_yyqu_cd
      AND rp.area_level = sales_sum.area_level
      AND rp.area_cd = sales_sum.area_cd
      AND rp.area_nm = sales_sum.area_nm
      AND rp.trdar_se_cd = sales_sum.trdar_se_cd
      AND rp.trdar_se_cd_nm = sales_sum.trdar_se_cd_nm
      LEFT JOIN v_working_population wp
        ON wp.stdr_yyqu_cd = sales_sum.stdr_yyqu_cd
      AND wp.area_level = sales_sum.area_level
      AND wp.area_cd = sales_sum.area_cd
      AND wp.area_nm = sales_sum.area_nm
      AND wp.trdar_se_cd = sales_sum.trdar_se_cd
      AND wp.trdar_se_cd_nm = sales_sum.trdar_se_cd_nm
      LEFT JOIN store_sum
        ON store_sum.stdr_yyqu_cd = sales_sum.stdr_yyqu_cd
      AND store_sum.area_level = sales_sum.area_level
      AND store_sum.area_cd = sales_sum.area_cd
      AND store_sum.area_nm = sales_sum.area_nm
      AND store_sum.trdar_se_cd = sales_sum.trdar_se_cd
      AND store_sum.trdar_se_cd_nm = sales_sum.trdar_se_cd_nm
    `;
    return rows;
  }

  // 3) 유동인구 조회(간단): 핵심 지표 + 시간대/요일 일부
  async getFootTrafficSummary(params: AreaQueryParams) {
    const { stdrYyquCd, areaCd } = params;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        stdr_yyqu_cd AS "유동인구 기준 년분기 코드",
        area_level AS "지역 수준",
        area_cd AS "지역 코드",
        area_nm AS "지역 이름",
        trdar_se_cd AS "상권 구분 코드",
        trdar_se_cd_nm AS "상권 구분 코드 명",
        tot_flpop_co AS "총 유동인구",
        ml_flpop_co AS "남자 유동인구",
        fml_flpop_co AS "여자 유동인구",
        agrde_20_flpop_co AS "20대 유동인구",
        agrde_30_flpop_co AS "30대 유동인구",
        tmzon_17_21_flpop_co AS "17~21시 유동인구",
        sat_flpop_co AS "토요일 유동인구",
        sun_flpop_co AS "일요일 유동인구"
      FROM v_foot_traffic
      WHERE stdr_yyqu_cd = ${stdrYyquCd}
        AND area_cd = ${areaCd}
      LIMIT 1
    `;
    return rows;
  }

  // 4) 상주인구 조회(간단): 인구 + 가구(아파트/비아파트)
  async getResidentPopulationSummary(params: AreaQueryParams) {
    const { stdrYyquCd, areaCd } = params;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        stdr_yyqu_cd AS "상주인구 기준 년분기 코드",
        area_level AS "지역 수준",
        area_cd AS "지역 코드",
        area_nm AS "지역 이름",
        trdar_se_cd AS "상권 구분 코드",
        trdar_se_cd_nm AS "상권 구분 코드 명",
        tot_repop_co AS "총 상주인구",
        ml_repop_co AS "남자 상주인구",
        fml_repop_co AS "여자 상주인구",
        agrde_20_repop_co AS "20대 상주인구",
        agrde_30_repop_co AS "30대 상주인구",
        tot_hshld_co AS "상주인구 총 가구 수",
        apt_hshld_co AS "상주인구 아파트 가구 수",
        non_apt_hshld_co AS "상주인구 비아파트 가구 수"
      FROM v_resident_population
      WHERE stdr_yyqu_cd = ${stdrYyquCd}
        AND area_cd = ${areaCd}
      LIMIT 1
    `;
    return rows;
  }

  // 5) 직장인구 조회(간단): 인구 + 성별/연령 일부
  async getWorkingPopulationSummary(params: AreaQueryParams) {
    const { stdrYyquCd, areaCd } = params;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        stdr_yyqu_cd AS "직장인구 기준 년분기 코드",
        area_level AS "지역 수준",
        area_cd AS "지역 코드",
        area_nm AS "지역 이름",
        trdar_se_cd AS "상권 구분 코드",
        trdar_se_cd_nm AS "상권 구분 코드 명",
        tot_wrc_popltn_co AS "총 직장인구",
        ml_wrc_popltn_co AS "남자 직장인구",
        fml_wrc_popltn_co AS "여자 직장인구",
        agrde_20_wrc_popltn_co AS "20대 직장인구",
        agrde_30_wrc_popltn_co AS "30대 직장인구"
      FROM v_working_population
      WHERE stdr_yyqu_cd = ${stdrYyquCd}
        AND area_cd = ${areaCd}
      LIMIT 1
    `;
    return rows;
  }

  // 6) 매출 조회(업종 TOP): 상권 내 업종별 매출 상위
  async getSalesTopIndustries(params: AreaQueryParams & { limit?: number }) {
    const { stdrYyquCd, areaCd, limit = 5 } = params;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        stdr_yyqu_cd AS "매출 기준 년분기 코드",
        area_level AS "지역 수준",
        area_cd AS "지역 코드",
        area_nm AS "지역 이름",
        trdar_se_cd AS "상권 구분 코드",
        trdar_se_cd_nm AS "상권 구분 코드 명",
        svc_induty_cd AS "매출 서비스업종 코드",
        svc_induty_cd_nm AS "매출 서비스업종 이름",
        thsmon_selng_amt AS "해당 분기 매출 금액",
        thsmon_selng_co AS "해당 분기 매출 건수"
      FROM v_sales
      WHERE stdr_yyqu_cd = ${stdrYyquCd}
        AND area_cd = ${areaCd}
      ORDER BY thsmon_selng_amt DESC
      LIMIT ${limit}
    `;
    return rows;
  }

  // 7) 점포/경쟁 조회(업종 TOP): 상권 내 업종별 점포/경쟁/프차/개폐업
  async getStoreTopIndustries(params: AreaQueryParams & { limit?: number }) {
    const { stdrYyquCd, areaCd, limit = 5 } = params;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        stdr_yyqu_cd AS "점포 기준 년분기 코드",
        area_level AS "지역 수준",
        area_cd AS "지역 코드",
        area_nm AS "지역 이름",
        trdar_se_cd AS "상권 구분 코드",
        trdar_se_cd_nm AS "상권 구분 코드 명",
        svc_induty_cd AS "점포 서비스업종 코드",
        svc_induty_cd_nm AS "점포 서비스업종 이름",
        stor_co AS "점포 수",
        similr_induty_stor_co AS "유사 업종 점포 수",
        frc_stor_co AS "프랜차이즈 점포 수",
        opbiz_rt AS "점포 개업률",
        clsbiz_rt AS "점포 폐업률"
      FROM v_store
      WHERE stdr_yyqu_cd = ${stdrYyquCd}
        AND area_cd = ${areaCd}
      ORDER BY stor_co DESC
      LIMIT ${limit}
    `;
    return rows;
  }

  // 8) 소득/소비 조회(간단): 소득 + 소비 항목 일부
  async getIncomeConsumptionSummary(params: AreaQueryParams) {
    const { stdrYyquCd, areaCd } = params;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        stdr_yyqu_cd AS "소득소비지출 기준 년분기 코드",
        area_level AS "지역 수준",
        area_cd AS "지역 코드",
        area_nm AS "지역 이름",
        trdar_se_cd AS "상권 구분 코드",
        trdar_se_cd_nm AS "상권 구분 코드 명",
        mt_avrg_income_amt AS "소득소비지출 월평균 소득 금액",
        expndtr_totamt AS "소득소비지출 소비 지출 총액",
        fd_expndtr_totamt AS "소득소비지출 식비 소비 지출 총액",
        trnsport_expndtr_totamt AS "소득소비지출 교통 소비 지출 총액",
        plesr_expndtr_totamt AS "소득소비지출 유흥 소비 지출 총액"
      FROM v_income_consumption
      WHERE stdr_yyqu_cd = ${stdrYyquCd}
        AND area_cd = ${areaCd}
      LIMIT 1
    `;
    return rows;
  }

  // 9) 상권 변화지표 조회(간단): 상태 + 운영/폐업 개월
  async getCommercialChangeSummary(params: AreaQueryParams) {
    const { stdrYyquCd, areaCd } = params;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        stdr_yyqu_cd AS "변화지표 기준 년분기 코드",
        area_level AS "지역 수준",
        area_cd AS "지역 코드",
        area_nm AS "지역 이름",
        trdar_se_cd AS "상권 구분 코드",
        trdar_se_cd_nm AS "상권 구분 코드 명",
        trdar_chnge_ix_nm AS "변화지표 상태",
        opr_sale_mt_avrg AS "변화지표 평균 운영 영업 개월 수",
        cls_sale_mt_avrg AS "변화지표 평균 폐업 영업 개월 수",
        su_opr_sale_mt_avrg AS "변화지표 서울시 평균 운영 영업 개월 수",
        su_cls_sale_mt_avrg AS "변화지표 서울시 평균 폐업 영업 개월 수"
      FROM v_commercial_change
      WHERE stdr_yyqu_cd = ${stdrYyquCd}
        AND area_cd = ${areaCd}
      LIMIT 1
    `;
    return rows;
  }

  // 10) 상권 비교(2개 상권 예시): 유동인구/매출 합계 비교
  async compareCommercialAreas(params: {
    stdrYyquCd: string;
    areaCodes: string[];
  }) {
    const { stdrYyquCd, areaCodes } = params;
    if (areaCodes.length === 0) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<any[]>`
      WITH
      ft AS (
        SELECT
          stdr_yyqu_cd,
          area_level,
          area_cd,
          area_nm,
          trdar_se_cd,
          trdar_se_cd_nm,
          tot_flpop_co
        FROM v_foot_traffic
        WHERE stdr_yyqu_cd = ${stdrYyquCd}
          AND area_cd IN (${Prisma.join(areaCodes)})
      ),
      sales AS (
        SELECT
          stdr_yyqu_cd,
          area_level,
          area_cd,
          area_nm,
          trdar_se_cd,
          trdar_se_cd_nm,
          SUM(thsmon_selng_amt) AS thsmon_selng_amt
        FROM v_sales
        WHERE stdr_yyqu_cd = ${stdrYyquCd}
          AND area_cd IN (${Prisma.join(areaCodes)})
        GROUP BY 1, 2, 3, 4, 5, 6
      )
      SELECT
        ft.area_nm AS "지역 이름",
        ft.tot_flpop_co AS "총 유동인구",
        sales.thsmon_selng_amt AS "해당 분기 매출 금액"
      FROM ft
      LEFT JOIN sales
        ON sales.stdr_yyqu_cd = ft.stdr_yyqu_cd
      AND sales.area_level = ft.area_level
      AND sales.area_cd = ft.area_cd
      AND sales.area_nm = ft.area_nm
      AND sales.trdar_se_cd = ft.trdar_se_cd
      AND sales.trdar_se_cd_nm = ft.trdar_se_cd_nm
      ORDER BY sales.thsmon_selng_amt DESC NULLS LAST
    `;
    return rows;
  }
}
