<?php

/*
The MIT License (MIT)

Copyright (c) 2017 Alex Corvi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**=========================================================================
 * 
 * ZIP CLASS		0.3.0
 * -----------------------------------------------------------------------------
 * # Description:   A replacement for the default codeigniter zip class.
 *					This class can be used for extracting, creating
 *					and modifying zip files.
 *					------------------------------------------------------------
 *					What so special about this class is that in case the
 *					PHP's zipArchive isn't found it will automatically
 *					fallback to PclZip library.
 *					http://www.phpconcept.net/pclzip/
 *					
 *					However, both zipArchive and PclZip require the zlib
 *					extension. Most of shared hosts does have the zlib
 *					extension. But according to use cases of the wordpress
 *					plugin duplicate, not all shared hosts have the 
 *					zipArchive class.
 *					
 *					It's also very easy to use.
 * -----------------------------------------------------------------------------
 * # Usage			$this->load->library(zip/zip);
 *					
 *					// creating a zip file (or adding to existing one)
 *					// 1. multiline style
 *					$this->zip->zip_start("path/to/new/or/old/file");
 *					$this->zip->zip_add("path/to/file/to/be/added");
 *					$this->zip->zip_end();
 *					// 2. one-line style
 *					$this->zip_files("file/to/be/added","new/or/old/file");
 *					------------------------------------------------------------
 *					// unzipping a zip file to a new directory
 *					// 1. multiline style
 * 					$this->zip->unzip_file("path/to/file/to/be/unzipped");
 *					$this->zip->unzip_to("path/to/new/dir/");
 *					// 2. one-line style
 * 					$this->zip->unzip_file("path/to/zip","path/to/new/dir/");
 * 
 * 
 * 
 * -----------------------------------------------------------------------------
 * # Author:		Alex Corvi	<alex@array.com>
 *					As a part of a CRM project written in PHP/Codeigniter.
 * -----------------------------------------------------------------------------
 * # Licence:		The MIT License (MIT)
 *					Copyright (c) <2016> <Alex Corvi>
 *					------------------------------------------------------------
 *					Permission is hereby granted, free of charge, to any person
 *					obtaining a copy of this software and associated
 *					documentation files (the "Software"), to deal in the
 *					Software without restriction, including without limitation
 *					the rights to use, copy, modify, merge, publish, distribute,
 *					sublicense, and/or sell copies of the Software, and to
 *					permit persons to whom the Software is furnished to do so,
 *					subject to the following conditions:
 * 
 *						1.	The above copyright notice and this permission
 *							notice shall be included in all copies or
 *							substantial portions of the Software.
 *						2.	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
 *							OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 *							LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *							FITNESS FOR A PARTICULAR PURPOSE AND
 *							NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 *							COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
 *							OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 *							CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
 *							OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 *							OTHER DEALINGS IN THE SOFTWARE.
 * 
 * -----------------------------------------------------------------------------
 * 
**/

class Q_Zip {
	
	
	// for creating or adding files
	protected $lib;				// which library to use
	protected $org_files;       // an array of the files or strings to be zipped
	protected $new_file_path;	// the path to which the zip will be created
	protected $new_file_name;	// file name
	
	// for extracting files
	protected $extr_file;		// the file to be extracted
	protected $extr_dirc;		// the target directory which will hold the extarcted files
	
	
	
	public function __construct(){
		$this->lib = 0;
		$this->extr_file = 0;
		$this->new_file_path = 0;
		$this->org_files = array();
	}
	
	
	
	/**=========================================================================
	 * 
	 * ZIP -> ZIP START
	 * -------------------------------------------------------------------------
	 * # Description:   When creating (or adding files to) a zip file
	 *					this method will initilize the process
	 *					by taking the zip file path and deceding
	 *					which library to use.
	 *					--------------------------------------------------------
	 *					Note: This method doesn't interact in anyway with the
	 *					zip library.  It just saves variables and decides which
	 *					library to use.
	 * -------------------------------------------------------------------------
	 * # params:        $file_path	<string>	.zip file name.
	 * -------------------------------------------------------------------------
	 * # return:		true
	 * -------------------------------------------------------------------------
	**/
	
	public function zip_start($file_path) {
		
		// save the new file path
		$this->new_file_path = $file_path;
		
		// Some php installations doesn't have the ZipArchive
		// So in this case we'll use another lib called PclZip
		if(class_exists("ZipArchive")) $this->lib = 1;
		else $this->lib = 2;
		return true;
	}
	
	
	
	
	
	
	
	
	/**=========================================================================
	 * 
	 * ZIP -> ZIP ADD
	 * -------------------------------------------------------------------------
	 * # Description:   When creating (or adding files to) a zip file
	 *					this method will add a file(s) path to the files array.
	 *					--------------------------------------------------------
	 *					Note: This method doesn't interact in anyway with the
	 *					zip library.  It just adds file to the array variable.
	 *					--------------------------------------------------------
	 *					Note: in case of a directory this method will pass the
	 *					directory path to a private method that will do the
	 *					heavy lifting.
	 * -------------------------------------------------------------------------
	 * # params:        $in		<string>	file path
	 *							<string>	directory path
	 *							<string>	file paths and directories delimited
	 *										by ",".
	 *							<array>		array of file and directory paths
	 * -------------------------------------------------------------------------
	 * # return:		true
	 * -------------------------------------------------------------------------
	**/
	
	public function zip_add($in){
		
		// just to make sure.. if the user haven't called the earlier method
		if($this->lib === 0 || $this->new_file_path === 0) throw new Exception("PHP-ZIP: must call zip_start before zip_add");
		
		
		// then check if it exists => either push single file
		// or push whole directory.
		// pushing whole directory done through a private method of this class.
		if(is_string($in)){
			if(file_exists($in)) {
				if(!is_dir($in)) array_push($this->org_files,$in);
				else $this->push_whole_dir($in);
			}
		}
		
		// passing an array => recursively call this same method for every value
		else foreach($in as $value){
			$this->zip_add($value);
		}
		
		return true;
		
	}
	
	
	
	
	
	
	
	
	
	/**=========================================================================
	 * 
	 * ZIP -> ZIP END
	 * -------------------------------------------------------------------------
	 * # Description:   When creating (or adding files to) a zip file
	 *					this method is what actually going to create the zip
	 *					file, using the variables registered by previously
	 *					called methods
	 * -------------------------------------------------------------------------
	 * # params:        NONE
	 * -------------------------------------------------------------------------
	 * # return:		true
	 * -------------------------------------------------------------------------
	**/
	
	public function zip_end($force_lib = false) {

		// force usage of specific lib (for testing purposes)
		if($force_lib === 2) {
			$this->lib = 2;
		}
		elseif ($force_lib === 1) {
			$this->lib = 1;
		}

		// just to make sure.. if the user haven't called the earlier method
		if($this->lib === 0 || $this->new_file_path === 0) throw new Exception('PHP-ZIP: zip_start and zip_add haven\'t been called yet');

		// using zipArchive class
		if($this->lib === 1) {
			$names = $this->commonPath($this->org_files, true);
			$lib = new ZipArchive();
			if(!$lib->open($this->new_file_path,ZIPARCHIVE::CREATE)) throw new Exception('PHP-ZIP: Permission Denied or zlib can\'t be found');
			
			$count_before = $lib->numFiles;
			

			// add each file
			foreach ($this->org_files as $index => $org_file_path) {
				// add the file to the archive
				$lib->addFile($org_file_path,$names[$index]);
			}
			
			$count_after = $lib->numFiles;

			// close the archive
			$lib->close();
		}
		
		
		// using PclZip
		if($this->lib === 2) {
			// require the lib
			require_once "Zip/pclzip.lib.php";
			$common = $this->commonPath($this->org_files, false);

			if(!$lib = new PclZip($this->new_file_path)) throw new Exception('PHP-ZIP: Permission Denied or zlib can\'t be found');
			$count_before = count($lib->listContent());
			// add them
			$lib->add($this->org_files, PCLZIP_OPT_REMOVE_PATH, $common[0]);
			// check number of files now in the archive
			$count_after = count($lib->listContent());
		}
		
		if(!file_exists($this->new_file_path)) throw new Exception('PHP-ZIP: After doing the zipping file can not be found');
		if(filesize($this->new_file_path) === 0) throw new Exception('PHP-ZIP: After doing the zipping file size is still 0 bytes');
		
		// empty the array
		$this->org_files = array();
		
		return true;
	}
	



	/**=========================================================================
	 * 
	 * ZIP -> ZIP FILES
	 * -------------------------------------------------------------------------
	 * # Description:   Just a wrapper around the three functions above for
	 *					one-line style coding
	 * -------------------------------------------------------------------------
	 * # params:        $files	<string>	file path
	 *							<string>	directory path
	 *							<string>	file paths and directories delimited
	 *										by ",".
	 *							<array>		array of file and directory paths
	 *					--------------------------------------------------------
	 *					$to		<string>	zip file name.	
	 * -------------------------------------------------------------------------
	 * # return:		SAME AS zip_end()
	 * -------------------------------------------------------------------------
	**/
	
	public function zip_files($files,$to) {
		
		$this->zip_start($to);
		$this->zip_add($files);
		return $this->zip_end();
		
	}
	




	/**=========================================================================
	 * 
	 * ZIP -> UNZIP FILE
	 * -------------------------------------------------------------------------
	 * # Description:   Unzipping files is either initilized by this method or
	 *					done completely with this method, depending on the
	 *					second parameter.
	 * -------------------------------------------------------------------------
	 * # params:        $file_path		<string>	zip file path
	 *					--------------------------------------------------------
	 *					$target_dir		<string>	target directory to which
	 *												the contents of the zip
	 *												file will be extract to
	 * -------------------------------------------------------------------------
	 * # return:		true
	 * -------------------------------------------------------------------------
	**/
	
	public function unzip_file($file_path,$target_dir=NULL) {
		

		// if it doesn't exist
		if(!file_exists($file_path)) throw new Exception("PHP-ZIP: File doesn't Exist");
		
		// check mimetype
		$_FILEINFO = finfo_open(FILEINFO_MIME_TYPE);
		$file_mime_type = finfo_file($_FILEINFO, $file_path);
		if(!array_search($file_mime_type,array(
			'application/x-zip',
			'application/zip',
			'application/x-zip-compressed',
			'application/s-compressed',
			'multipart/x-zip')
		)) throw new Exception("PHP-ZIP: File type is not ZIP");
		
		
		$this->extr_file = $file_path;
		
		if(class_exists("ZipArchive")) $this->lib = 1;
		else $this->lib = 2;
		
		if($target_dir !== NULL) return $this->unzip_to($target_dir);
		else return true;
		
	}
	
	
	
	
	/**=========================================================================
	 * 
	 * ZIP -> UNZIP TO
	 * -------------------------------------------------------------------------
	 * # Description:   In multi-line style coding this method will be used
	 *					for unzipping
	 * -------------------------------------------------------------------------
	 * # params:        $target_dir		<string>	target directory to which
	 *												the contents of the zip
	 *												file will be extract to
	 * -------------------------------------------------------------------------
	 * # return:		true
	 * -------------------------------------------------------------------------
	**/
	
	public function unzip_to($target_dir) {
		
		// validations -- start //
		if($this->lib === 0 && $this->extr_file === 0) throw new Exception("PHP-ZIP: unzip_file hasn't been called");
		// it exists, but it's not a directory
		if(file_exists($target_dir) && (!is_dir($target_dir))) throw new Exception("PHP-ZIP: Target directory exists as a file not a directory");
		// it doesn't exist
		if(!file_exists($target_dir)) if(!mkdir($target_dir, 0777, true)) throw new Exception("PHP-ZIP: Directory not found, and unable to create it");
		// validations -- end //
		
		$this->extr_dirc = $target_dir;
		
		// extract using ZipArchive
		if($this->lib === 1) {
			$lib = new ZipArchive;
			if(!$lib->open($this->extr_file)) throw new Exception("PHP-ZIP: Unable to open the zip file");
			if(!$lib->extractTo($this->extr_dirc)) throw new Exception("PHP-ZIP: Unable to extract files");
			$lib->close();
		} 
		
		
		// extarct using PclZip
		if($this->lib === 2) {
			require_once "Zip/pclzip.lib.php";
			$lib = new PclZip($this->extr_file);
			if(!$lib->extract(PCLZIP_OPT_PATH,$this->extr_dirc)) throw new Exception("PHP-ZIP: Unable to extract files");
		}
		
		return true;
		
	}
	
	
	
	
	/**=========================================================================
	 * 
	 * ZIP -> dir_to_assoc_arr
	 * -------------------------------------------------------------------------
	 * # Description:   When dealing with directories being added to the zip.
	 *					This method is useful in converting a whole directory
	 *					and subdirectories into an associative array with the
	 *					file names.
	 * 
	 * -------------------------------------------------------------------------
	 * # params:        $dir		<string>	target directory.
	 * -------------------------------------------------------------------------
	 * # return:		Associate array
	 * -------------------------------------------------------------------------
	**/
	
	private function dir_to_assoc_arr(DirectoryIterator $dir) {
		$data = array();
		foreach ($dir as $node) {
			if ( $node->isDir() && !$node->isDot() ) {
				$data[$node->getFilename()] = $this->dir_to_assoc_arr(new DirectoryIterator($node->getPathname()));
			} else if( $node->isFile() ) {
				$data[] = $node->getFilename();
			}
		}
		return $data;
	}
	
	
	
	
	/**=========================================================================
	 * 
	 * ZIP -> push_whole_dir
	 * -------------------------------------------------------------------------
	 * # Description:   When dealing with directories being added to the zip.
	 *					This method will call the one above (dir_to_assoc_arr)
	 *					to convert the directory to an associative array, then
	 *					convert this associative array to a plain array on
	 *					which each value is a path of the file.
	 *					--------------------------------------------------------
	 *					KNOWN LIMITS: since the array will be plain, the files
	 *					of the directory will be added to the zip plainly,
	 *					meaning the zip file will not have any directory
	 *					even if the original directory from which the files are
	 *					taken have sub directories.
	 * -------------------------------------------------------------------------
	 * # params:        $dir	<string>	target directory.
	 * -------------------------------------------------------------------------
	 * # return:		VOID
	 * -------------------------------------------------------------------------
	**/
	
	private function push_whole_dir($dir){
		$dir_array = $this->dir_to_assoc_arr(new DirectoryIterator($dir));
		foreach($dir_array as $key => $value) {
			if(!is_array($value)) array_push($this->org_files,$this->path($dir,$value));
			else {
				$this->push_whole_dir($this->path($dir,$key));
			}
		}
	}
	
	
	/**=========================================================================
	 * ZIP -> path
	 * -------------------------------------------------------------------------
	 * # Description:   Will just return the arguments as a path delimited by
	 *					the DIRECTORY_SEPARATOR of php.
	 * -------------------------------------------------------------------------
	 *	# Params		$...	<string>	directory or file names
	 * -------------------------------------------------------------------------
	 * # return:		string of path
	 * -------------------------------------------------------------------------
	**/
	
	private function path() {
		return join(DIRECTORY_SEPARATOR, func_get_args());
	}
	
	/**=========================================================================
	 * ZIP -> commonPath
	 * -------------------------------------------------------------------------
	 * # Description:   Will remove the common path from files
	 * -------------------------------------------------------------------------
	 *	# Params		$files Array<string>
	 * -------------------------------------------------------------------------
	 * # return:		Array<string>
	 * -------------------------------------------------------------------------
	**/
	private function commonPath($files, $remove = true) {
		foreach($files as $index => $filesStr) {
			$files[$index] = explode(DIRECTORY_SEPARATOR, $filesStr);
		}
		$toDiff = $files;
		foreach($toDiff as $arr_i => $arr) {
			foreach($arr as $name_i => $name) {
				$toDiff[$arr_i][$name_i] = $name . "___" . $name_i;
			}
		}
		$diff = call_user_func_array("array_diff",$toDiff);
		reset($diff);
		$i = key($diff) - 1;
		if($remove) {
			foreach($files as $index => $arr) {
				$files[$index] = implode(DIRECTORY_SEPARATOR,array_slice($files[$index], $i));
			}
		}
		else {
			foreach($files as $index => $arr) {
				$files[$index] = implode(DIRECTORY_SEPARATOR,array_slice($files[$index], 0, $i));
			}
		}
		return $files;
	}

}
