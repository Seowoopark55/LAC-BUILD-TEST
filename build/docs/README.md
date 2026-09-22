# LAC BUILD 문서

- `updates/`: 기존 `UPDATE-V*.txt` 버전별 업데이트 내역 38개 (내용 그대로 보존)
- `organize-existing-root.ps1`: 이전 전체본을 복사·덮어쓰기했던 프로젝트의 최상위에 남아 있는 **동일한** 업데이트 TXT만 안전하게 정리하는 선택 실행 스크립트

SQL 마이그레이션(`SUPABASE-MIGRATION-*.sql`)은 경로 변경에 따른 혼동을 피하기 위해 프로젝트 최상위에 유지합니다. **이번 문서 정리를 위해 SQL을 실행할 필요는 없습니다.**
