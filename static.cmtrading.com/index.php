<?php   
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Path to the product images folder
$product_images_dir = './product_images';

// Check if the directory exists
if (!is_dir($product_images_dir)) {
    die("Product images directory does not exist.");
}

// Scan the product images directory and get all image files
$all_images = scandir($product_images_dir);

// Filter out '.' and '..' directories
$images = array_filter($all_images, function($image) use ($product_images_dir) {
    return !is_dir($product_images_dir . '/' . $image);
});

// If there is a search query, filter the images by file name
$search_query = isset($_GET['search']) ? strtolower($_GET['search']) : '';
if ($search_query) {
    $images = array_filter($images, function($image) use ($search_query) {
        return strpos(strtolower($image), $search_query) !== false;
    });
}

// Display search form and results
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Images</title>
    <!-- Include Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Link to custom style.css -->
    <link rel="stylesheet" href="./style.css">
</head>

<body>

    <div class="container">
        <h1 class="text-center mb-4">Product Images</h1>

        <!-- Search bar with Bootstrap classes -->
        <div class="form-container mb-4">
            <form method="GET" action="">
                <div class="mb-3">
                    <label for="search" class="form-label">Search by File Name</label>
                    <input type="text" id="search" name="search" class="form-control" placeholder="Search for an image"
                        value="<?php echo htmlspecialchars($search_query); ?>" />
                </div>
                <button type="submit" class="btn btn-primary">Search</button>
            </form>
        </div>

        <h2>Image File Names</h2>

        <div class="row">
            <?php if (count($images) > 0): ?>
            <?php foreach ($images as $image): ?>
            <div class="col-sm-4 col-md-3 mb-3">
                <!-- Card to display image file name -->
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title"><?php echo htmlspecialchars($image); ?></h5>
                        <!-- View button that opens image in a new tab -->
                        <a href="<?php echo './product_images/' . urlencode($image); ?>" class="btn btn-outline-primary"
                            target="_blank">View</a>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
            <?php else: ?>
            <p>No images found.</p>
            <?php endif; ?>
        </div>
    </div>

    <!-- Include Bootstrap JS (optional) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>