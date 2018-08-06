"""
    An Image comparison utility to find differences in similar images
    Version : 1.0.0
    Author : Prasad Madhbhavikar <prasad.madhbhavikar@gmail.com>
    License : MIT
"""

from skimage.measure import compare_ssim
import numpy as np
import argparse
import imutils
import ntpath
import cv2 as cv
import os


# input arguments
args = {}


def parse_arguments():
    """ construct the argument parse and parse the arguments, handle invalid arguments """
    arg_parser = argparse.ArgumentParser(
        description='An Image comparison utility to find differences in similar images', epilog="Created with love in India")
    arg_parser.add_argument("-b", "--baseline", required=True,
                            help="Baselined input image file path to be considered as a reference")
    arg_parser.add_argument("-i", "--input", required=True,
                            help="Input image file path to be compared with the baselined Image")
    arg_parser.add_argument("-s", "--sift", action='store_true',
                            help="Use Patented SIFT algorithm implementation")
    arg_parser.add_argument("-o", "--file", required=False,
                            help="Output file to save the observed differences")
    arg_parser.add_argument("-O", "--dir", required=False,
                            help="Output folder path to save the processed Images, the folder should exist")
    arg_parser.add_argument("-d", "--delta", action='store_true',
                            help="Save Delta Image; if no --dir option is specified, path of the --input file would be used")
    arg_parser.add_argument("-t", "--threshold", action='store_true',
                            help="Save Threshold Image; if no --dir option is specified, path of the --input file would be used")
    arg_parser.add_argument("-m", "--mappings", action='store_true',
                            help="Save mapping matrix Image; if no --dir option is specified, path of the --input file would be used")
    arg_parser.add_argument("-a", "--aligned", action='store_true',
                            help="Save aligned Image; if no --dir option is specified, path of the --input file would be used")
    arg_parser.add_argument("-p", "--pipeline", action='store_true',
                            help="Return Image in place of Structural Similarity Index, if set no images would be shown.")
    arg_parser.add_argument("-A", "--showAligned",
                            action='store_true', help="Show aligned Image")
    arg_parser.add_argument(
        "-M", "--showMapping", action='store_true', help="Show mapping matrix Image")
    arg_parser.add_argument("-D", "--showDelta",
                            action='store_true', help="Show Delta Image")
    arg_parser.add_argument("-T", "--showThreshold",
                            action='store_true', help="Show Threshold Image")
    global args
    args = vars(arg_parser.parse_args())

    if(args['dir'] is not None and not os.path.isdir(args['dir'])):
        print("Given path [%s] is not a directory!" % args['dir'])
        sys.exit()
    file_dir = None
    if(args['file'] is not None):
        file_dir = os.path.dirname(args['file'])
    if(file_dir):
        print("Given path [%s] does not exist, cannot proceed!" % file_dir)
        sys.exit()

    if(args['file'] is not None and os.path.exists(args['file'])):
        print(
            "Given file [%s] exists on the system, cannot proceed!" % args['file'])
        sys.exit()


def calculate_padding(base_image_height, base_image_width, target_image_height, target_image_width):
    """ 
    Calculate the padding Values for the given images so that they are of same size

    Parameters
    ----------
    base_image_height : int
        The height of the baseline image
    base_image_width : int
        The width of the baseline image
    target_image_height : int
        The height of the target image
    target_image_width : int
        The height of the target image

    Returns
    -------
    base_left : int
        Left padding value for Baseline Image
    base_right : int
        Right padding value for Baseline Image
    base_top : int
        Top padding value for Baseline Image
    base_bottom : int
        Bottom padding value for Baseline Image
    target_left : int
        Left padding value for Target Image
    target_right : int
        Right padding value for Target Image
    target_top : int
        Top padding value for Target Image
    target_bottom : int
        Bottom padding value for Target Image
    """
    delta_height = max(base_image_height, target_image_height) - \
        min(base_image_height, target_image_height)
    delta_width = max(base_image_width, target_image_width) - \
        min(base_image_width, target_image_width)

    target_top = target_left = target_bottom = target_right = base_top = base_left = base_bottom = base_right = 0

    # both images are of same size
    if(delta_height == 0 and delta_width == 0):
        return (base_left, base_right, base_top, base_bottom, target_left, target_right, target_top, target_bottom)

    top, carry = divmod(delta_height, 2)
    bottom = top + carry
    left, carry = divmod(delta_width, 2)
    right = left + carry

    # Assign the top, bottom, left, right padding values tom make
    # the image of same size
    if(base_image_height > target_image_height):
        target_top = top
        target_bottom = bottom
    elif(base_image_height < target_image_height):
        base_top = top
        base_bottom = bottom

    if(base_image_width > target_image_width):
        target_left = left
        target_right = right
    elif(base_image_width < target_image_width):
        base_left = left
        base_right = right

    return (base_left, base_right, base_top, base_bottom, target_left, target_right, target_top, target_bottom)


def resize(base_image, target_image):
    """
    Resize images so that both the images are of same size without any loss, mismatch space is padded with black color.

    Parameters
    ----------
    base_image : ndarray
        Baseline Image.  Any dimensionality.
    target_image : ndarray
        Target Image.  Any dimensionality.

    Returns
    -------
    base_image : ndarray
        Resized, non scaled Baseline Image of same dimensions as that of target image.
    target_image : ndarray
        Resized, non scaled Target Image of same dimensions as that of Baseline image.
    result : boolean
        True if resizing was performed, False else wise.
    """
    base_image_height, base_image_width = base_image.shape[:2]
    target_image_height, target_image_width = target_image.shape[:2]

    base_left, base_right, base_top, base_bottom, target_left, target_right, target_top, target_bottom = calculate_padding(
        base_image_height, base_image_width, target_image_height, target_image_width)
    if(target_left == 0 and target_right == 0 and target_top == 0 and target_bottom == 0 and base_left == 0 and base_right == 0 and base_top == 0 and base_bottom == 0):
        return (base_image, target_image, False)

    # Add black padding
    base_image = cv.copyMakeBorder(
        base_image, base_top, base_bottom, base_left, base_right, cv.BORDER_CONSTANT, value=[0, 0, 0])
    target_image = cv.copyMakeBorder(target_image, target_top, target_bottom,
                                     target_left, target_right, cv.BORDER_CONSTANT, value=[0, 0, 0])
    return (base_image, target_image, True)


def align_image(color_base_image, color_target_image, grey_base_image=None, grey_target_image=None, use_sift=False, use_pipeline=True, file_name=None, save_mappings=False, save_aligned_image=False, show_mappings=False, show_aligned_image=False):
    """
    Align a Target image with the baseline image wherever possible. If the images cannot be aligned then the function simply returns the target image.
    This Function implements two algorithms:
        SIFT algorithms that OpenCV calls “non-free” modules. This algorithms is patented by their respective creators, and while they are free to use in academic and research settings, you should technically be obtaining a license/permission from the creators. if you are using them in a commercial (i.e. for-profit) application.
        ORB which is free to use.

    Parameters
    ----------
    color_base_image : ndarray
        Baseline colour Image. Can be of any dimensionality but same as color_target_image dimensionality
    color_target_image : ndarray
        Target colour Image. Can be of any dimensionality but same as color_base_image dimensionality
    grey_base_image : ndarray, optional
        Baseline grey Image. Can be of any dimensionality but same as color_base_image dimensionality
    grey_target_image : ndarray, optional
        Target grey Image. Can be of any dimensionality but same as color_target_image dimensionality
    use_sift : boolean, Optional
        If set to True, will use the Patented SIFT algorithm.
    use_pipeline : boolean, Optional
        Super seeds the options (show_mappings, show_aligned_image) and is True by default, If set to False will allow showing the corresponding images.
    file_name : string, optional if not using save_mappings and save_aligned_image
        File Path to save the processed output images.
    save_mappings : boolean, Optional
        If set to True, will save the mappings for further debugging.
    save_aligned_image : boolean, Optional
        If set to True, will save the Aligned Image for further debugging.
    show_mappings : boolean, Optional
        If set to True, will show the mappings for further debugging.
    show_aligned_image : boolean, Optional
        If set to True, will show the Aligned Image for further debugging.

    Returns
    -------
    aligned_image : ndarray
        Realigned Target Image of same dimensions as that of target image.
    """
    # Minimum matches threshold to classify as match found
    MIN_MATCH_COUNT = 4
    if(grey_base_image is None):
        grey_base_image = cv.cvtColor(color_base_image, cv.COLOR_BGR2GRAY)

    if(grey_target_image is None):
        grey_target_image = cv.cvtColor(color_target_image, cv.COLOR_BGR2GRAY)

    matcher_image = color_target_image.copy()
    if(use_sift):
        # SIFT and SURF are examples of algorithms that OpenCV calls “non-free” modules.
        # These algorithms are patented by their respective creators,
        # and while they are free to use in academic and research settings,
        # you should technically be obtaining a license/permission from the creators
        # if you are using them in a commercial (i.e. for-profit) application.
        # Removed in CSV3 refer : https://www.pyimagesearch.com/2015/07/16/where-did-sift-and-surf-go-in-opencv-3/
        print("Using SIFT, make sure you are not using it for commercial use; unless you have the license.")
        print("You have been warned!")
        feature_detector = cv.xfeatures2d.SIFT_create()
        # Create flann matcher
        FLANN_INDEX_KDTREE = 1
        matcher = cv.FlannBasedMatcher(
            dict(algorithm=FLANN_INDEX_KDTREE, trees=5), {})
    else:
        FLANN_INDEX_LSH = 6
        feature_detector = cv.ORB_create(1024)
        # Create flann matcher
        matcher = cv.FlannBasedMatcher(dict(
            algorithm=FLANN_INDEX_LSH, table_number=6, key_size=12, multi_probe_level=1), {})

    # Detect keypoints and compute keypointer descriptors
    keypoints1, descriptors1 = feature_detector.detectAndCompute(
        grey_base_image, None)
    keypoints2, descriptors2 = feature_detector.detectAndCompute(
        grey_target_image, None)

    if(descriptors2 is None or descriptors1 is None):
        # Images are totally different so simply return the target image
        return color_target_image

    # KNN Match to get Top2
    matches = matcher.knnMatch(descriptors1, descriptors2, 2)

    # Sort by their distance.
    matches = sorted(matches, key=lambda x: x[0].distance)

    # Ratio test, to get good matches.
    good = [m1 for (m1, m2) in matches if m1.distance < 0.7 * m2.distance]

    # find homography matrix
    if len(good) > MIN_MATCH_COUNT:
        # (queryIndex for the small object, trainIndex for the scene )
        src_pts = np.float32(
            [keypoints1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
        dst_pts = np.float32(
            [keypoints2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
        # find homography matrix in cv.RANSAC using good match points
        M, mask = cv.findHomography(src_pts, dst_pts, cv.RANSAC, 5.0)
        h, w = color_base_image.shape[:2]
        pts = np.float32([[0, 0], [0, h-1], [w-1, h-1],
                          [w-1, 0]]).reshape(-1, 1, 2)
        dst = cv.perspectiveTransform(pts, M)
        if(save_mappings and not use_pipeline):
            cv.polylines(matcher_image, [np.int32(
                dst)], True, (0, 255, 0), 3, cv.LINE_AA)
    else:
        # This means that the image cannot be aligned, simply return the target image to avoid any errors
        print("Not enough matches are found - {}/{}".format(len(good), MIN_MATCH_COUNT))
        return color_target_image

    # Crop the matched region from scene
    h, w = color_base_image.shape[:2]
    pts = np.float32([[0, 0], [0, h-1], [w-1, h-1], [w-1, 0]]
                     ).reshape(-1, 1, 2)
    dst = cv.perspectiveTransform(pts, M)
    perspectiveM = cv.getPerspectiveTransform(np.float32(dst), pts)
    found = cv.warpPerspective(color_target_image, perspectiveM, (w, h))

    if(save_mappings or show_mappings):
        matched = cv.drawMatches(
            color_base_image, keypoints1, matcher_image, keypoints2, good, None)

    if(not file_name is None):
        if(save_mappings):
            cv.imwrite(file_name + ".mapped.png", matched)

        if(save_aligned_image):
            cv.imwrite(file_name + ".aligned.png", found)

    if(not use_pipeline):
        if(show_mappings):
            cv.imshow("Mapping Matrix", matched)

        if(show_aligned_image):
            cv.imshow("Aligned Image", found)

    return found


def file_name(path):
    """
    Returns the file name given a file path
    Parameters
    ----------
    path : string
        The path from which file name needs to be filtered

    Returns
    -------
    file_name : string
        The name of the file from the path along with the extension if any.
    """
    head, tail = ntpath.split(path)
    return tail or ntpath.basename(head)


def compute_ssim(base_grey_image, target_grey_image, use_pipeline=True, file_name=None,  save_differences=False, save_threshold=False, show_differences=False, show_threshold=False):
    """
    Compute the Structural Similarity Index (SSIM) between the two images, ensuring that the difference image is returned

    Parameters
    ----------
    base_grey_image : ndarray
        Baseline grey Image. Can be of any dimensionality but same as target_grey_image dimensionality
    target_grey_image : ndarray
        Target grey Image. Can be of any dimensionality but same as base_grey_image dimensionality
    use_pipeline : boolean, Optional
        Super seeds the options (show_differences, show_threshold) and is True by default, If set to False will allow showing the corresponding images.
    file_name : string, optional if not using save_differences and save_threshold
        File name to save the processed output images.
    save_differences : boolean, Optional
        If set to True, will save the Delta Image for further debugging.
    save_threshold : boolean, Optional
        If set to True, will save the Threshold Image for further debugging.
    show_differences : boolean, Optional
        If set to True, will show the Delta Image for further debugging.
    show_threshold : boolean, Optional
        If set to True, will show the Threshold Image for further debugging.

    Returns
    -------
    difference_image : ndarray
        An Image Depicting the difference between the base_grey_image and target_grey_image, same as base_grey_image dimensionality 
    threshold_image : ndarray
        An Image Depicting the Threshold difference between the base_grey_image and target_grey_image, same as base_grey_image dimensionality 
    score : float
        A Structural Similarity Index (SSIM) for the two input images
    contours : ndarray
        contours, An Array containing the differences observed 
    """
    (score, difference_image) = compare_ssim(base_grey_image,
                                             target_grey_image, gaussian_weights=True, full=True)
    difference_image = (difference_image * 255).astype("uint8")

    # threshold the difference image, followed by finding contours to
    # obtain the regions of the two input images that differ
    threshold_image = cv.threshold(
        difference_image, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU)[1]
    contours = cv.findContours(
        threshold_image.copy(), cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    contours = contours[0] if imutils.is_cv2() else contours[1]

    if(not file_name is None):
        if(save_differences):
            cv.imwrite(file_name + ".delta.png", difference_image)

        if(save_threshold):
            cv.imwrite(file_name + ".threshold.png", threshold_image)

    if(not use_pipeline):
        if(show_differences):
            cv.imshow("Delta Image", difference_image)
        if(show_threshold):
            cv.imshow("Threshold Image", threshold_image)

    print("Structural Similarity Index: {}".format(score))
    return (difference_image, threshold_image, score, contours)


def main():
    parse_arguments()
    base_image, target_image, resized = resize(
        cv.imread(args['baseline']), cv.imread(args['input']))
    base_grey_image = cv.cvtColor(base_image, cv.COLOR_BGR2GRAY)
    target_gray = cv.cvtColor(target_image, cv.COLOR_BGR2GRAY)

    input_image_path = os.path.realpath(args['input'])
    if(args['dir']):
        save_dir = os.path.realpath(args['dir'])
        save_file_template = os.path.join(
            save_dir, file_name(input_image_path))
    else:
        save_dir = os.path.dirname(input_image_path)
        save_file_template = os.path.join(
            save_dir, file_name(input_image_path))

    if(resized):
        target_image = align_image(base_image, target_image, base_grey_image, target_gray,
                                   args['sift'], args['pipeline'], save_file_template, args['mappings'], args['aligned'], args['showMapping'], args['showAligned'])

    corrected_image = cv.cvtColor(target_image, cv.COLOR_BGR2GRAY)
    difference_image, threshold_image, score, contours = compute_ssim(
        base_grey_image, corrected_image, args['pipeline'], save_file_template, args['delta'], args['threshold'], args['showDelta'], args['showThreshold'])

    # loop over the contours
    for c in contours:
        # compute the bounding box of the contour and then draw the
        # bounding box on both input images to represent where the two
        # images differ
        (x, y, w, h) = cv.boundingRect(c)
        cv.rectangle(target_image, (x, y), (x + w, y + h), (0, 0, 255), 1)

    if(score < 1):
        if(args['file']):
            cv.imwrite(args['file'], target_image)
        else:
            cv.imwrite(save_file_template + ".diff.png", target_image)

    if(args['pipeline']):
        return target_image
    else:
        cv.imshow("Baseline Image", base_image)
        cv.imshow("Target Image", target_image)
        cv.waitKey(0)
        cv.destroyAllWindows()
        return score


if __name__ == "__main__":
    main()
