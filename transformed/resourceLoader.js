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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceUrl = exports.createResourceImport = exports.replaceResources = void 0;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var ts = __importStar(require("typescript"));
function replaceResources(shouldTransform, getTypeChecker, directTemplateLoading) {
    if (directTemplateLoading === void 0) { directTemplateLoading = false; }
    return function (context) {
        var typeChecker = getTypeChecker();
        var resourceImportDeclarations = [];
        var visitNode = function (node) {
            if (ts.isClassDeclaration(node)) {
                var decorators = ts.visitNodes(node.decorators, function (node) {
                    return ts.isDecorator(node)
                        ? visitDecorator(node, typeChecker, directTemplateLoading, resourceImportDeclarations, context)
                        : node;
                });
                return ts.updateClassDeclaration(node, decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, node.members);
            }
            return ts.visitEachChild(node, visitNode, context);
        };
        return function (sourceFile) {
            if (!shouldTransform(sourceFile.fileName)) {
                return sourceFile;
            }
            var updatedSourceFile = ts.visitNode(sourceFile, visitNode);
            if (resourceImportDeclarations.length) {
                // Add resource imports
                return ts.updateSourceFileNode(updatedSourceFile, ts.setTextRange(ts.createNodeArray(__spreadArrays(resourceImportDeclarations, updatedSourceFile.statements)), updatedSourceFile.statements));
            }
            return updatedSourceFile;
        };
    };
}
exports.replaceResources = replaceResources;
function visitDecorator(node, typeChecker, directTemplateLoading, resourceImportDeclarations, context) {
    if (!isComponentDecorator(node, typeChecker)) {
        return node;
    }
    if (!ts.isCallExpression(node.expression)) {
        return node;
    }
    var decoratorFactory = node.expression;
    var args = decoratorFactory.arguments;
    if (args.length !== 1 || !ts.isObjectLiteralExpression(args[0])) {
        // Unsupported component metadata
        return node;
    }
    var objectExpression = args[0];
    var styleReplacements = [];
    // visit all properties
    var properties = ts.visitNodes(objectExpression.properties, function (node) {
        return ts.isObjectLiteralElementLike(node)
            ? visitComponentMetadata(node, styleReplacements, directTemplateLoading, resourceImportDeclarations, context)
            : node;
    });
    // replace properties with updated properties
    if (styleReplacements.length > 0) {
        var styleProperty = ts.createPropertyAssignment(ts.createIdentifier('styles'), ts.createArrayLiteral(styleReplacements));
        properties = ts.createNodeArray(__spreadArrays(properties, [styleProperty]));
    }
    return ts.updateDecorator(node, ts.updateCall(decoratorFactory, decoratorFactory.expression, decoratorFactory.typeArguments, [
        ts.updateObjectLiteral(objectExpression, properties),
    ]));
}
function visitComponentMetadata(node, styleReplacements, directTemplateLoading, resourceImportDeclarations, context) {
    if (!ts.isPropertyAssignment(node) || ts.isComputedPropertyName(node.name)) {
        return node;
    }
    var name = node.name.text;
    switch (name) {
        case 'moduleId':
            return undefined;
        case 'templateUrl':
            var importName = createResourceImport(node.initializer, directTemplateLoading ? '!raw-loader!' : '', resourceImportDeclarations, context);
            if (!importName) {
                return node;
            }
            var prop = context.factory.updatePropertyAssignment(node, context.factory.createIdentifier('template'), importName);
            // importName.parent = prop;
            return prop;
        case 'styles':
        case 'styleUrls':
            if (!ts.isArrayLiteralExpression(node.initializer)) {
                return node;
            }
            var isInlineStyles_1 = name === 'styles';
            var styles = ts.visitNodes(node.initializer.elements, function (node) {
                if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) {
                    return node;
                }
                if (isInlineStyles_1) {
                    return ts.createLiteral(node.text);
                }
                return createResourceImport(node, undefined, resourceImportDeclarations, context) || node;
            });
            // Styles should be placed first
            if (isInlineStyles_1) {
                styleReplacements.unshift.apply(styleReplacements, styles);
            }
            else {
                styleReplacements.push.apply(styleReplacements, styles);
            }
            return undefined;
        default:
            return node;
    }
}
function createResourceImport(node, loader, resourceImportDeclarations, context) {
    var url = getResourceUrl(node, loader);
    if (!url) {
        return null;
    }
    var tsFactory = context.factory;
    var importName = context.factory.createIdentifier("__NG_CLI_RESOURCE__" + resourceImportDeclarations.length);
    resourceImportDeclarations.push(tsFactory.createImportDeclaration(undefined, undefined, tsFactory.createImportClause(false, importName, undefined), tsFactory.createStringLiteral(url)));
    return importName;
}
exports.createResourceImport = createResourceImport;
function getResourceUrl(node, loader) {
    if (loader === void 0) { loader = ''; }
    // only analyze strings
    if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) {
        return null;
    }
    return "" + loader + (/^\.?\.\//.test(node.text) ? '' : './') + node.text;
}
exports.getResourceUrl = getResourceUrl;
function isComponentDecorator(node, typeChecker) {
    if (!ts.isDecorator(node)) {
        return false;
    }
    var origin = getDecoratorOrigin(node, typeChecker);
    if (origin && origin.module === '@angular/core' && origin.name === 'Component') {
        return true;
    }
    return false;
}
function getDecoratorOrigin(decorator, typeChecker) {
    if (!ts.isCallExpression(decorator.expression)) {
        return null;
    }
    var identifier;
    var name = '';
    if (ts.isPropertyAccessExpression(decorator.expression.expression)) {
        identifier = decorator.expression.expression.expression;
        name = decorator.expression.expression.name.text;
    }
    else if (ts.isIdentifier(decorator.expression.expression)) {
        identifier = decorator.expression.expression;
    }
    else {
        return null;
    }
    // NOTE: resolver.getReferencedImportDeclaration would work as well but is internal
    var symbol = typeChecker.getSymbolAtLocation(identifier);
    if (symbol && symbol.declarations && symbol.declarations.length > 0) {
        var declaration = symbol.declarations[0];
        var module_1;
        if (ts.isImportSpecifier(declaration)) {
            name = (declaration.propertyName || declaration.name).text;
            module_1 = declaration.parent.parent.parent.moduleSpecifier.text;
        }
        else if (ts.isNamespaceImport(declaration)) {
            // Use the name from the decorator namespace property access
            module_1 = declaration.parent.parent.moduleSpecifier.text;
        }
        else if (ts.isImportClause(declaration)) {
            name = declaration.name.text;
            module_1 = declaration.parent.moduleSpecifier.text;
        }
        else {
            return null;
        }
        return { name: name, module: module_1 };
    }
    return null;
}
