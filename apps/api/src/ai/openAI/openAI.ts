import OpenAI from 'openai';
import { AreaVectorDto, BusinessCategoryVectorDto } from '../dto/column-vector';

// Singleton OpenAI client
class OpenAIClient {
  private static client: OpenAI;
  static getClient() {
    if (!this.client) {
      this.client = new OpenAI();
    }
    return this.client;
  }
}

export function getText(response: OpenAI.Responses.Response) {
  return response?.output_text || '';
}

export function embedText(text: string) {
  return OpenAIClient.getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
}

export function getCategoryByMessage(message: string) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0,
    instructions: `
            사용자 질의에 있는 업종을 분석하여 뽑아주세요 여러 업종이 있을 경우 ,로 구분하여 나열해주세요
            업종이 없을 경우 "" 빈문자열을 반환해주세요
            ex) "홍대에서 잘나가는 업종 알려줘" -> ""
            ex) "서울시 강남구에서 음식점과 카페 매출 알려줘" -> "음식점, 카페"
            ex) "한식 음식점이 잘 팔리는 상권은 어디야?" -> "한식 음식점"
            ex) "한식과 일식 매출 비교해줘" -> "한식, 일식"
    `,
  });
}

export function getLocationByMessage(message: string) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0,
    instructions: `
            사용자 질의에 있는 위치 정보를 분석하여 뽑아주세요 여러 위치가 있을 경우 ,로 구분하여 나열해주세요
            위치 정보 단계는 [시, 자치구, 행정동, 상권]이 있습니다. 문맥을 파악하여 적절한 단계로 뽑아주세요
            위치 정보가 없을 경우 빈문자열을 반환해주세요
            ex) "홍대에서 잘나가는 업종 알려줘" -> "홍대"
            ex) "강남구에서 음식점과 카페 매출 알려줘" -> "서울시, 강남구"
            ex) "서울대입구역 8번 출구 근처 상권이 궁금해" -> "서울대입구역 8번"
    `,
  });
}

export function nlToSql(
  message: string,
  categories: BusinessCategoryVectorDto[],
  areaList: AreaVectorDto[],
) {
  console.log(formatAreaVectors(areaList));
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    // reasoning: {
    //   effort: 'low',
    // },
    instructions: `
            당신은 postgreSQL 전문가입니다.
            Output only the SQL query.
            Do not include explanations, comments, markdown, or code fences.
            Return plain SQL text only.

            주어진 질의에 대해 postgreSQL 문을 짜주세요.
            데이터 해석이 쉽도록 적절한 alias를 사용해 주세요.
            컬럼과 테이블 매핑을 필수로 해주세요
            시점에 따른 말이 없을 경우 기본적으로 stdr_yyqu_cd = '20253' 조건을 넣어주세요
            limit은 최대 3건으로 해주세요
            
            아래 데이터베이스 테이블과 컬럼을 참고하세요.
            dataset,column_name,data_type,description
            v_commercial_change,stdr_yyqu_cd,text,변화지표 기준 년분기 코드
            v_commercial_change,area_level,text,지역 수준
            v_commercial_change,area_cd,text,지역 코드
            v_commercial_change,area_nm,text,지역 이름
            v_commercial_change,trdar_chnge_ix,text,변화지표 값
            v_commercial_change,trdar_chnge_ix_nm,text,변화지표 상태
            v_commercial_change,opr_sale_mt_avrg,integer,변화지표 평균 운영 영업 개월 수
            v_commercial_change,cls_sale_mt_avrg,integer,변화지표 평균 폐업 영업 개월 수
            v_commercial_change,su_opr_sale_mt_avrg,integer,변화지표 서울시 평균 운영 영업 개월 수
            v_commercial_change,su_cls_sale_mt_avrg,integer,변화지표 서울시 평균 폐업 영업 개월 수
            v_foot_traffic,stdr_yyqu_cd,text,유동인구 기준 년분기 코드
            v_foot_traffic,area_level,text,지역 수준
            v_foot_traffic,area_cd,text,지역 코드
            v_foot_traffic,area_nm,text,지역 이름
            v_foot_traffic,tot_flpop_co,bigint,총 유동인구
            v_foot_traffic,ml_flpop_co,bigint,남자 유동인구
            v_foot_traffic,fml_flpop_co,bigint,여자 유동인구
            v_foot_traffic,agrde_10_flpop_co,bigint,10대 유동인구
            v_foot_traffic,agrde_20_flpop_co,bigint,20대 유동인구
            v_foot_traffic,agrde_30_flpop_co,bigint,30대 유동인구
            v_foot_traffic,agrde_40_flpop_co,bigint,40대 유동인구
            v_foot_traffic,agrde_50_flpop_co,bigint,50대 유동인구
            v_foot_traffic,agrde_60_above_flpop_co,bigint,60대 이상 유동인구
            v_foot_traffic,tmzon_00_06_flpop_co,bigint,00~06시 유동인구
            v_foot_traffic,tmzon_06_11_flpop_co,bigint,06~11시 유동인구
            v_foot_traffic,tmzon_11_14_flpop_co,bigint,11~14시 유동인구
            v_foot_traffic,tmzon_14_17_flpop_co,bigint,14~17시 유동인구
            v_foot_traffic,tmzon_17_21_flpop_co,bigint,17~21시 유동인구
            v_foot_traffic,tmzon_21_24_flpop_co,bigint,21~24시 유동인구
            v_foot_traffic,mon_flpop_co,bigint,월요일 유동인구
            v_foot_traffic,tues_flpop_co,bigint,화요일 유동인구
            v_foot_traffic,wed_flpop_co,bigint,수요일 유동인구
            v_foot_traffic,thur_flpop_co,bigint,목요일 유동인구
            v_foot_traffic,fri_flpop_co,bigint,금요일 유동인구
            v_foot_traffic,sat_flpop_co,bigint,토요일 유동인구
            v_foot_traffic,sun_flpop_co,bigint,일요일 유동인구
            v_income_consumption,stdr_yyqu_cd,text,소득소비지출 기준 년분기 코드
            v_income_consumption,area_level,text,지역 수준
            v_income_consumption,area_cd,text,지역 코드
            v_income_consumption,area_nm,text,지역 이름
            v_income_consumption,mt_avrg_income_amt,integer,소득소비지출 월평균 소득 금액
            v_income_consumption,income_sctn_cd,text,소득소비지출 소득 구간 코드
            v_income_consumption,expndtr_totamt,bigint,소득소비지출 소비 지출 총액
            v_income_consumption,fdstffs_expndtr_totamt,bigint,소득소비지출 식료품 소비 지출 총액
            v_income_consumption,clths_ftwr_expndtr_totamt,bigint,소득소비지출 의류 및 신발 소비 지출 총액
            v_income_consumption,lvspl_expndtr_totamt,bigint,소득소비지출 생활용품 소비 지출 총액
            v_income_consumption,mcp_expndtr_totamt,bigint,소득소비지출 의료비 소비 지출 총액
            v_income_consumption,trnsport_expndtr_totamt,bigint,소득소비지출 교통 소비 지출 총액
            v_income_consumption,edc_expndtr_totamt,bigint,소득소비지출 교육 소비 지출 총액
            v_income_consumption,plesr_expndtr_totamt,bigint,소득소비지출 유흥 소비 지출 총액
            v_income_consumption,lsr_cltur_expndtr_totamt,bigint,소득소비지출 여가 문화 소비 지출 총액
            v_income_consumption,etc_expndtr_totamt,bigint,소득소비지출 기타 소비 지출 총액
            v_income_consumption,fd_expndtr_totamt,bigint,소득소비지출 식비 소비 지출 총액
            v_resident_population,stdr_yyqu_cd,text,상주인구 기준 년분기 코드
            v_resident_population,area_level,text,지역 수준
            v_resident_population,area_cd,text,지역 코드
            v_resident_population,area_nm,text,지역 이름
            v_resident_population,tot_repop_co,integer,총 상주인구
            v_resident_population,ml_repop_co,integer,남자 상주인구
            v_resident_population,fml_repop_co,integer,여자 상주인구
            v_resident_population,agrde_10_repop_co,integer,10대 상주인구
            v_resident_population,agrde_20_repop_co,integer,20대 상주인구
            v_resident_population,agrde_30_repop_co,integer,30대 상주인구
            v_resident_population,agrde_40_repop_co,integer,40대 상주인구
            v_resident_population,agrde_50_repop_co,integer,50대 상주인구
            v_resident_population,agrde_60_above_repop_co,integer,60대 이상 상주인구
            v_resident_population,mag_10_repop_co,integer,10대 남자 상주인구
            v_resident_population,mag_20_repop_co,integer,20대 남자 상주인구
            v_resident_population,mag_30_repop_co,integer,30대 남자 상주인구
            v_resident_population,mag_40_repop_co,integer,40대 남자 상주인구
            v_resident_population,mag_50_repop_co,integer,50대 남자 상주인구
            v_resident_population,mag_60_above_repop_co,integer,60대 이상 남자 상주인구
            v_resident_population,fag_10_repop_co,integer,10대 여자 상주인구
            v_resident_population,fag_20_repop_co,integer,20대 여자 상주인구
            v_resident_population,fag_30_repop_co,integer,30대 여자 상주인구
            v_resident_population,fag_40_repop_co,integer,40대 여자 상주인구
            v_resident_population,fag_50_repop_co,integer,50대 여자 상주인구
            v_resident_population,fag_60_above_repop_co,integer,60대 이상 여자 상주인구
            v_resident_population,tot_hshld_co,integer,상주인구 총 가구 수
            v_resident_population,apt_hshld_co,integer,상주인구 아파트 가구 수
            v_resident_population,non_apt_hshld_co,integer,상주인구 비아파트 가구 수
            v_sales,stdr_yyqu_cd,text,매출 기준 년분기 코드
            v_sales,stdr_year,integer,기준 연도
            v_sales,stdr_quarter,integer,기준 분기
            v_sales,area_level,text,지역 수준
            v_sales,area_cd,text,지역 코드
            v_sales,area_nm,text,지역 이름
            v_sales,svc_induty_cd,text,매출 서비스업종 코드
            v_sales,svc_induty_cd_nm,text,매출 서비스업종 이름
            v_sales,thsmon_selng_amt,bigint,해당 분기 매출 금액
            v_sales,thsmon_selng_co,integer,해당 분기 매출 건수
            v_sales,mdwk_selng_amt,bigint,주중 매출 금액
            v_sales,wkend_selng_amt,bigint,주말 매출 금액
            v_sales,mon_selng_amt,bigint,월요일 매출 금액
            v_sales,tues_selng_amt,bigint,화요일 매출 금액
            v_sales,wed_selng_amt,bigint,수요일 매출 금액
            v_sales,thur_selng_amt,bigint,목요일 매출 금액
            v_sales,fri_selng_amt,bigint,금요일 매출 금액
            v_sales,sat_selng_amt,bigint,토요일 매출 금액
            v_sales,sun_selng_amt,bigint,일요일 매출 금액
            v_sales,tmzon_00_06_selng_amt,bigint,00~06시 매출 금액
            v_sales,tmzon_06_11_selng_amt,bigint,06~11시 매출 금액
            v_sales,tmzon_11_14_selng_amt,bigint,11~14시 매출 금액
            v_sales,tmzon_14_17_selng_amt,bigint,14~17시 매출 금액
            v_sales,tmzon_17_21_selng_amt,bigint,17~21시 매출 금액
            v_sales,tmzon_21_24_selng_amt,bigint,21~24시 매출 금액
            v_sales,ml_selng_amt,bigint,남자 매출 금액
            v_sales,fml_selng_amt,bigint,여자 매출 금액
            v_sales,agrde_10_selng_amt,bigint,10대 매출 금액
            v_sales,agrde_20_selng_amt,bigint,20대 매출 금액
            v_sales,agrde_30_selng_amt,bigint,30대 매출 금액
            v_sales,agrde_40_selng_amt,bigint,40대 매출 금액
            v_sales,agrde_50_selng_amt,bigint,50대 매출 금액
            v_sales,agrde_60_above_selng_amt,bigint,60대 이상 매출 금액
            v_sales,mdwk_selng_co,integer,주중 매출 건수
            v_sales,wkend_selng_co,integer,주말 매출 건수
            v_sales,mon_selng_co,integer,월요일 매출 건수
            v_sales,tues_selng_co,integer,화요일 매출 건수
            v_sales,wed_selng_co,integer,수요일 매출 건수
            v_sales,thur_selng_co,integer,목요일 매출 건수
            v_sales,fri_selng_co,integer,금요일 매출 건수
            v_sales,sat_selng_co,integer,토요일 매출 건수
            v_sales,sun_selng_co,integer,일요일 매출 건수
            v_sales,tmzon_00_06_selng_co,integer,00~06시 매출 건수
            v_sales,tmzon_06_11_selng_co,integer,06~11시 매출 건수
            v_sales,tmzon_11_14_selng_co,integer,11~14시 매출 건수
            v_sales,tmzon_14_17_selng_co,integer,14~17시 매출 건수
            v_sales,tmzon_17_21_selng_co,integer,17~21시 매출 건수
            v_sales,tmzon_21_24_selng_co,integer,21~24시 매출 건수
            v_sales,ml_selng_co,integer,남자 매출 건수
            v_sales,fml_selng_co,integer,여자 매출 건수
            v_sales,agrde_10_selng_co,integer,10대 매출 건수
            v_sales,agrde_20_selng_co,integer,20대 매출 건수
            v_sales,agrde_30_selng_co,integer,30대 매출 건수
            v_sales,agrde_40_selng_co,integer,40대 매출 건수
            v_sales,agrde_50_selng_co,integer,50대 매출 건수
            v_sales,agrde_60_above_selng_co,integer,60대 이상 매출 건수
            v_store,stdr_yyqu_cd,text,점포 기준 년분기 코드
            v_store,stdr_year,integer,기준 연도
            v_store,stdr_quarter,integer,기준 분기
            v_store,area_level,text,지역 수준
            v_store,area_cd,text,지역 코드
            v_store,area_nm,text,지역 이름
            v_store,svc_induty_cd,text,점포 서비스업종 코드
            v_store,svc_induty_cd_nm,text,점포 서비스업종 이름
            v_store,stor_co,integer,점포 수
            v_store,similr_induty_stor_co,integer,유사 업종 점포 수
            v_store,opbiz_rt,double precision,점포 개업률
            v_store,opbiz_stor_co,integer,개업 점포 수
            v_store,clsbiz_rt,double precision,점포 폐업률
            v_store,clsbiz_stor_co,integer,폐업 점포 수
            v_store,frc_stor_co,integer,프랜차이즈 점포 수
            v_working_population,stdr_yyqu_cd,text,직장인구 기준 년분기 코드
            v_working_population,area_level,text,지역 수준
            v_working_population,area_cd,text,지역 코드
            v_working_population,area_nm,text,지역 이름
            v_working_population,tot_wrc_popltn_co,integer,총 직장인구
            v_working_population,ml_wrc_popltn_co,integer,남자 직장인구
            v_working_population,fml_wrc_popltn_co,integer,여자 직장인구
            v_working_population,agrde_10_wrc_popltn_co,integer,10대 직장인구
            v_working_population,agrde_20_wrc_popltn_co,integer,20대 직장인구
            v_working_population,agrde_30_wrc_popltn_co,integer,30대 직장인구
            v_working_population,agrde_40_wrc_popltn_co,integer,40대 직장인구
            v_working_population,agrde_50_wrc_popltn_co,integer,50대 직장인구
            v_working_population,agrde_60_above_wrc_popltn_co,integer,60대 이상 직장인구
            v_working_population,mag_10_wrc_popltn_co,integer,10대 남자 직장인구
            v_working_population,mag_20_wrc_popltn_co,integer,20대 남자 직장인구
            v_working_population,mag_30_wrc_popltn_co,integer,30대 남자 직장인구
            v_working_population,mag_40_wrc_popltn_co,integer,40대 남자 직장인구
            v_working_population,mag_50_wrc_popltn_co,integer,50대 남자 직장인구
            v_working_population,mag_60_above_wrc_popltn_co,integer,60대 이상 남자 직장인구
            v_working_population,fag_10_wrc_popltn_co,integer,10대 여자 직장인구
            v_working_population,fag_20_wrc_popltn_co,integer,20대 여자 직장인구
            v_working_population,fag_30_wrc_popltn_co,integer,30대 여자 직장인구
            v_working_population,fag_40_wrc_popltn_co,integer,40대 여자 직장인구
            v_working_population,fag_50_wrc_popltn_co,integer,50대 여자 직장인구
            v_working_population,fag_60_above_wrc_popltn_co,integer,60대 이상 여자 직장인구


            업종 코드와 이름 같은경우 아래 값을 참고하세요.
            ${formatCategoryVectors(categories)}
            사용자가 원하는 정보가 업종 관련된 내용일 경우 반드시 업종코드(svc_induty_cd) 조건을 포함시켜 주세요.

            지역 코드와 이름 같은경우 아래 값을 참고하세요. 
            area_level이 commercial일 경우 area_code비교 대상을 trdar_se_cd를 사용하세요. 그 외에 경우 area_cd를 사용하세요
            ${formatAreaVectors(areaList)}
            `,
  });
}

export function analyzeSqlResults(message: string, results: any[]) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0.3,
    instructions: `
            아래 주어진 SQL 조회 결과 데이터를 분석하여 사용자 질의에 맞게 설명해 주세요.
            수치와 조회 결과 중심으로 설명해주세요.
            사용자는 SQL 결과를 알지 못합니다. 설명을 할 때 상권 명, 수치 등을 구체적으로 언급해 주세요.
            사용자에게 SQL문이나 코드와 같은 데이터를 말하지 마세요.
            ${JSON.stringify(results, safeBigIntStringify)}
            `,
  });
}

function formatAreaVectors(areas: AreaVectorDto[]): string {
  return areas
    .map(
      (area) =>
        `area_name: ${area.areaName}, area_level: ${area.areaLevel}, area_code: ${area.areaCode}`,
    )
    .join('\n');
}

function formatCategoryVectors(
  categories: BusinessCategoryVectorDto[],
): string {
  return categories
    .map(
      (cat) =>
        `svc_induty_cd: ${cat.code}, svc_induty_cd_nm: ${cat.category_name}`,
    )
    .join('\n');
}

function safeBigIntStringify(key: string, value: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof value === 'bigint' ? value.toString() : value;
}
