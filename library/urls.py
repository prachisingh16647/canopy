from django.urls import path
from . import views

urlpatterns = [
    # ================= Librarian Auth Routes =================
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # ================= Librarian HTML Template Routes =================
    path('', views.dashboard_page, name='dashboard'),              # Opens index.html
    path('books/', views.books_page, name='books_page'),           # Opens books.html
    path('members/', views.members_page, name='members_page'),     # Opens members.html
    path('issue-book/', views.issue_page, name='issue_page'),      # Opens issue-book.html
    path('return-book/', views.return_page, name='return_page'),   # Opens return-book.html
    path('due-books/', views.due_page, name='due_page'),           # Opens due-books.html
    path('reports/', views.reports_page, name='reports_page'),     # Opens reports.html
    path('settings/', views.settings_page, name='settings_page'),  # Opens settings.html

    # ================= Librarian API Data Endpoints =================
    path('api/dashboard/', views.dashboard_data, name='dashboard_data'),
    path('api/add-book/', views.add_book, name='add_book'),
    path('api/books-members/', views.get_books_and_members, name='books'),
    path('api/issue-book/', views.issue_book, name='issue_book'),
    path('api/active-borrows/', views.get_active_borrows, name='active_borrows'),
    path('api/return-book/', views.return_book, name='return_book'),
    path('api/add-member/', views.add_member, name='add_member'),
    path('api/all-books/', views.all_books, name='all_books'),
    path('api/all-members/', views.all_members, name='all_members'),
    path('api/due-books/', views.due_books, name='due_books'),
    path('api/reports/', views.reports_data, name='reports_data'),

    # ================= Member Portal =================
    path('member/login/', views.member_login_view, name='member_login'),
    path('member/logout/', views.member_logout_view, name='member_logout'),
    path('member/signup/', views.member_signup_view, name='member_signup'),
    path('member/', views.member_dashboard_view, name='member_dashboard'),
    path('member/settings/', views.member_settings_view, name='member_settings'),
]
