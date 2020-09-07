"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_1 = __importDefault(require("typescript"));
var resourceLoader_1 = require("./resourceLoader");
var fs = __importStar(require("fs"));
var filePath = "./example.component.ts";
var host = typescript_1.default.createCompilerHost({}, true);
var program = typescript_1.default.createProgram([filePath], {}, host);
var checker = program.getTypeChecker();
var output = typescript_1.default.transpileModule(fs.readFileSync(filePath).toString("utf-8"), {
    compilerOptions: {
        module: typescript_1.default.ModuleKind.CommonJS,
        target: typescript_1.default.ScriptTarget.ESNext,
    },
    transformers: {
        before: [
            resourceLoader_1.replaceResources(function () { return true; }, function () { return checker; }, true),
        ],
    },
});
fs.writeFileSync("./output.commonJS.ts", output.outputText);
