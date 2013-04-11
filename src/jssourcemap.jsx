/***
 * JavaScript source-map generator
 * @see Source Map Revision 3 Proposal - https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit
 */

/*
 * Copyright (c) 2012 DeNA Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import "js.jsx";

import "./util.jsx";

native __fake__ class _SourceMapGenerator {
	function addMapping(mapping : Map.<variant>) : void;
}

native __fake__ class _SourceMapConsumer {
	function originalPositionFor(generatedPos : variant) : variant;
}


class SourceMapper {

	var _rootDir : string;
	var _outputFile : string;
	var _copyDestDir : string;
	var _impl : _SourceMapGenerator;

	// Because the browse will request to get the original source files listed in the source mapping file, we prepare copies of the original source files.
	var _fileMap = new Map.<string>; // original-to-copy filename mapping

	static function createSourceMapGenerator(args : Map.<string>) : _SourceMapGenerator {
		return js.eval('new (require("source-map").SourceMapGenerator)('+JSON.stringify(args)+')')
				as __noconvert__ _SourceMapGenerator;
	}

	static function createSourceMapConsumer(mapping : variant) : _SourceMapConsumer {
		return js.eval('new (require("source-map").SourceMapConsumer)('+JSON.stringify(mapping)+')')
				as __noconvert__ _SourceMapConsumer;
	}

	function constructor (rootDir : string, outputFile : string) {
		this._rootDir = rootDir;
		this._outputFile = Util.resolvePath(outputFile);
		this._copyDestDir =  this._outputFile + ".mapping.d";
		this._impl = SourceMapper.createSourceMapGenerator({
			file       : Util.basename(this._outputFile),
			sourceRoot : Util.basename(this._copyDestDir)
		});
	}

	function add (generatedPos : Map.<number>, originalPos : Map.<number>, sourceFile : Nullable.<string>, tokenName : Nullable.<string>) : void {
		if (sourceFile != null) {
			if (sourceFile.indexOf(this._rootDir + "/") == 0) {
				sourceFile = sourceFile.substring(this._rootDir.length + 1);
			}
			if (! this._fileMap.hasOwnProperty(sourceFile)) {
				this._fileMap[sourceFile] = this._copyDestDir +"/"+ sourceFile;
			}
		}
		this._impl.addMapping({
			generated: generatedPos,
			original:  originalPos,
			source:    sourceFile,
			name:      tokenName
		} : Map.<variant>);
	}

	function getSourceMappingFile () : string {
		return this._outputFile + ".mapping";
	}

	function getSourceFileMap () : Map.<string> {
		return this._fileMap;
	}

	function generate () : string {
		return this._impl.toString();
	}

	function magicToken () : string {
		var sourceMappingFile = Util.basename(this.getSourceMappingFile());
		return "\n" + "//@ sourceMappingURL=" + sourceMappingFile + "\n";
	}
}
