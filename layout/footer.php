<<script>
    const links = document.querySelectorAll('.sidebar ul li a');
    const currentPage = window.location.pathname.split('/').pop();

    links.forEach(link => {
    if (link.dataset.page === currentPage) {
    link.parentElement.classList.add('active');
    }
    });
    </script>

    </body>

    </html>