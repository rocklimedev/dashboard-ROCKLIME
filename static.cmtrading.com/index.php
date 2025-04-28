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

// Convert images to an indexed array
$images = array_values($images);

// Pagination setup
$per_page = 12; // Images per page
$total_images = count($images);
$total_pages = ceil($total_images / $per_page);

// Get current page from URL, default is 1
$current_page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($current_page < 1) $current_page = 1;
if ($current_page > $total_pages) $current_page = $total_pages;

// Calculate start and end
$start_index = ($current_page - 1) * $per_page;
$images_to_display = array_slice($images, $start_index, $per_page);

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Images</title>
    <!-- Bootstrap CSS -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="./style.css">
</head>

<body>

    <div class="container mt-5">
        <h1 class="text-center mb-4">Product Images</h1>

        <!-- Search bar -->
        <div class="form-container mb-4">
            <form method="GET" action="">
                <div class="row g-2 align-items-center">
                    <div class="col-8">
                        <input type="text" id="search" name="search" class="form-control"
                            placeholder="Search for an image" value="<?php echo htmlspecialchars($search_query); ?>" />
                    </div>
                    <div class="col-4">
                        <button type="submit" class="btn btn-primary w-100">Search</button>
                    </div>
                </div>
            </form>
        </div>

        <div class="row g-3">
            <?php if (count($images_to_display) > 0): ?>
            <?php foreach ($images_to_display as $image): ?>
            <div class="col-6 col-md-4 col-lg-2">
                <div class="card h-100 shadow-sm">
                    <img src="<?php echo './product_images/' . urlencode($image); ?>" class="card-img-top img-fluid"
                        alt="<?php echo htmlspecialchars($image); ?>" style="height: 150px; object-fit: cover;">
                    <div class="card-body text-center p-2">
                        <h6 class="card-title text-truncate" style="font-size: 0.8rem;">
                            <?php echo htmlspecialchars($image); ?>
                        </h6>
                        <a href="<?php echo './product_images/' . urlencode($image); ?>"
                            class="btn btn-outline-primary btn-sm mt-1" target="_blank">View Full</a>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
            <?php else: ?>
            <div class="col-12">
                <p class="text-center">No images found.</p>
            </div>
            <?php endif; ?>
        </div>


        <!-- Pagination -->
        <?php if ($total_pages > 1): ?>
        <nav aria-label="Page navigation">
            <ul class="pagination justify-content-center">
                <!-- Previous button -->
                <li class="page-item <?php if ($current_page <= 1) echo 'disabled'; ?>">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => $current_page - 1])); ?>">Previous</a>
                </li>

                <!-- Page number links -->
                <?php for ($page = 1; $page <= $total_pages; $page++): ?>
                <li class="page-item <?php if ($current_page == $page) echo 'active'; ?>">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => $page])); ?>"><?php echo $page; ?></a>
                </li>
                <?php endfor; ?>

                <!-- Next button -->
                <li class="page-item <?php if ($current_page >= $total_pages) echo 'disabled'; ?>">
                    <a class="page-link"
                        href="?<?php echo http_build_query(array_merge($_GET, ['page' => $current_page + 1])); ?>">Next</a>
                </li>
            </ul>
        </nav>
        <?php endif; ?>

    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>