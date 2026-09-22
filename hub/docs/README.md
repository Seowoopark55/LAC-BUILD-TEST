# LAC HUB 문서 안내

프로젝트 최상위 `README.md`는 기존 기록을 보존합니다. 아래 문서는 **과거 AXE ONE / LAC ONE 단계별 개발 기록**이며, 제목에 남아 있는 옛 이름은 당시 기록입니다. 현재 브랜드는 **LAC HUB**입니다.

## 문서 위치

- `docs/history/info-stages/`: 과거 AXE ONE 정보 기능 Stage 1–11 검토 기록.
- `docs/history/branding/`: AXE ONE → LAC ONE → LAC HUB 리브랜딩 기록.
- `docs/history/releases/`: 회사 초대·글씨 크기·표 스크롤 개선 내역.
- `docs/MINIMAL_DISCORD_AUTH_SETUP.md`: 예전 Discord 이메일 권한 제거 검토 문서. **현재 적용 안내가 아니라 과거 검토 자료**입니다.
- `tests/validation/`: 현재 검사 스크립트가 참조하는 검증 기준 및 보고서. 경로 변경 없이 유지합니다.
- `database/migrations/`: SQL 이력. 적용 여부 확인 전 임의로 실행하거나 삭제하지 않습니다.

## 적용 및 안전 수칙

기존 코드, SQL, 디자인 리소스와 기준 테스트 파일은 이번 문서 정리에서 변경하지 않았습니다. 폴더 이동 전에 사용하던 최상위 문서 파일은 새 ZIP을 덮어쓰기만 해서는 없어지지 않으므로, 함께 제공한 삭제 목록의 **기존 경로만** 삭제하세요. `README.md`와 `docs/MINIMAL_DISCORD_AUTH_SETUP.md`는 삭제하지 마세요.
