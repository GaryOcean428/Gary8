# Search Functionality Improvement Roadmap

## Next Phase Plan
Next Phase Plan
- [x] Modernize **SearchRouter** to satisfy routing tests and align with updated AI model lineup.
- [x] Modernize **ModelRouter** to use the latest AI models and pass calibration tests.
- 🟡 Refactor **APIClient** to integrate the OpenAI Responses API and Agents SDK; fix configuration-store usage.
- [ ] Update **RetryHandler** to correctly detect offline status and implement circuit-breaking.

## Implementation Plan
- [x] **Step 1**: Update `src/lib/routing/search-router.ts`; ensure `search-router.test.ts` passes.
- [x] **Step 2**: Update `src/lib/routing/model-router.ts`; ensure `router.test.ts` passes.
- 🟡 **Step 3**: Refactor `src/lib/api-client.ts` to use the Responses API and Agents SDK; ensure `api-client.test.ts` passes.
- **Step 4**: Fix `src/lib/utils/RetryHandler.ts` for offline detection; ensure `RetryHandler.test.ts` passes.

## Next Steps
1. After each step, update this roadmap and `docs/PROJECT.md` with status.
2. Commit changes and run full test suite.
3. Document any encountered challenges or adjustments.
4. Proceed to the next step until all core tests are green.

## Phase 1: Critical Fixes (Current - Immediate)

- [x] Fix Edge Function deployment issues
- [x] Resolve Vite command execution errors
- [x] Update API key validation logic
- [x] Enhance error handling and reporting for Edge Functions
- [x] Implement comprehensive network diagnostics

## Phase 2: Resilience Improvements (Weeks 1-2)

- [ ] Develop caching mechanisms for search results
- [ ] Implement graceful degradation for network failures
- [ ] Add alternative content sources as fallbacks
- [ ] Enhance provider fallback chain with better prioritization
- [ ] Add offline mode support with cached content

## Phase 3: Model Router Optimization (Weeks 2-4)

- [ ] Refine model selection and routing logic
- [ ] Implement capability detection for more precise model selection
- [ ] Create comprehensive model configuration database
- [ ] Add adaptive learning for router threshold calibration
- [ ] Implement response format normalization across providers

## Phase 4: Advanced Features (Weeks 4-6) 

- [ ] Enhance memory system with persistence
- [ ] Implement metrics and monitoring for search quality
- [ ] Add performance optimization for streamed responses
- [ ] Develop unified tool schema across provider APIs
- [ ] Implement specialized search modes (academic, news, code)

## Progress Tracking

### Completed Tasks
- Added proper Edge Function structure for api-supabase
- Fixed Vite command execution by ensuring proper npm script configuration
- Enhanced API client with better error handling
- Improved model router with capability detection
- Updated API key validation to be more robust