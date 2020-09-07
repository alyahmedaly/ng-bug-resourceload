import ts from "typescript";
import { replaceResources } from "./resourceLoader";
import * as fs from "fs";

const filePath = "./example.component.ts";

const host = ts.createCompilerHost({}, true);

const program = ts.createProgram([filePath], {}, host);

const checker = program.getTypeChecker();

const output = ts.transpileModule(fs.readFileSync(filePath).toString("utf-8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ESNext,
  },
  transformers: {
    before: [
      replaceResources(
        () => true,
        () => checker,
        true
      ),
    ],
  },
});

fs.writeFileSync("./output.commonJS.ts", output.outputText);
