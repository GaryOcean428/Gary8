import { CodeAnalysisTool } from '../code-analysis-tool';
import { MonitoringService } from '../../monitoring/monitoring-service';

describe('CodeAnalysisTool', () => {
  let tool: CodeAnalysisTool;
  let monitoring: MonitoringService;

  beforeEach(() => {
    tool = new CodeAnalysisTool();
    monitoring = MonitoringService.getInstance();
  });

  describe('calculateComplexity', () => {
    it('should calculate cyclomatic complexity correctly', async () => {
      const code = `
        function test() {
          if (x) {
            while (y) {
              if (z) {
                // nested
              }
            }
          }
          try {
            // something
          } catch (e) {
            // error
          }
        }
      `;

      const result = await tool._call({
        code,
        language: 'typescript',
        depth: 3
      });
      const analysis = JSON.parse(result);
      
      expect(analysis.complexity).toBeGreaterThan(0);
      expect(typeof analysis.complexity).toBe('number');
    });
  });

  describe('identifyPatterns', () => {
    it('should identify singleton pattern', async () => {
      const code = `
        class Singleton {
          private static instance: Singleton;
          
          static getInstance() {
            return this.instance;
          }
        }
      `;

      const result = await tool._call({
        code,
        language: 'typescript'
      });
      const analysis = JSON.parse(result);

      expect(analysis.patterns).toContain('singleton');
    });

    it('should identify factory pattern', async () => {
      const code = `
        class Factory {
          createProduct() {
            return new Product();
          }
        }
      `;

      const result = await tool._call({
        code,
        language: 'typescript'
      });
      const analysis = JSON.parse(result);

      expect(analysis.patterns).toContain('factory');
    });
  });

  describe('performance monitoring', () => {
    it('should track analysis performance', async () => {
      const spy = jest.spyOn(monitoring, 'trackOperation');
      
      await tool._call({
        code: 'function test() { }',
        language: 'typescript',
        depth: 3
      });

      expect(spy).toHaveBeenCalledWith(
        'code_analysis',
        expect.any(Function)
      );
    });
  });
}); 