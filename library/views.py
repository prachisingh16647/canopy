from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import update_session_auth_hash
from django.http import JsonResponse
from .models import Book, Member, BorrowRecord, Profile
from django.utils import timezone
import json
from django.views.decorators.csrf import csrf_exempt
from datetime import date, datetime
import calendar
from functools import wraps


# ==================== ACCESS CONTROL ====================

def librarian_required(view_func):
    """Only allows staff/superuser accounts."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')

        if not (request.user.is_staff or request.user.is_superuser):
            return redirect('member_dashboard')

        return view_func(request, *args, **kwargs)

    return wrapper


def member_required(view_func):
    """Only allows accounts linked to a Member."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('member_login')

        if not hasattr(request.user, 'member_profile'):
            return redirect('dashboard')

        return view_func(request, *args, **kwargs)

    return wrapper


# ==================== LIBRARIAN PAGES ====================

@librarian_required
def dashboard_page(request):
    profile, _created = Profile.objects.get_or_create(
        user=request.user
    )

    return render(
        request,
        'index.html',
        {"profile": profile}
    )


@librarian_required
def books_page(request):
    return render(request, 'books.html')


@librarian_required
def members_page(request):
    return render(request, 'members.html')


@librarian_required
def issue_page(request):
    return render(request, 'issue-book.html')


@librarian_required
def return_page(request):
    return render(request, 'return-book.html')


@librarian_required
def due_page(request):
    return render(request, 'due-books.html')


@librarian_required
def reports_page(request):
    return render(request, 'reports.html')


@librarian_required
def settings_page(request):
    profile, _created = Profile.objects.get_or_create(
        user=request.user
    )

    password_form = PasswordChangeForm(
        user=request.user
    )

    message = None
    error = None

    if request.method == "POST":

        form_type = request.POST.get("form_type")

        if form_type == "profile_info":

            new_username = request.POST.get(
                "username",
                ""
            ).strip()

            if new_username:
                request.user.username = new_username
                request.user.save()

            if request.FILES.get("profile_picture"):
                profile.profile_picture = request.FILES[
                    "profile_picture"
                ]

            profile.save()

            message = "Profile updated successfully!"

        elif form_type == "change_password":

            password_form = PasswordChangeForm(
                user=request.user,
                data=request.POST
            )

            if password_form.is_valid():

                user = password_form.save()

                update_session_auth_hash(
                    request,
                    user
                )

                message = "Password changed successfully!"

                password_form = PasswordChangeForm(
                    user=request.user
                )

            else:
                error = "Please fix the errors below."

    return render(
        request,
        'settings.html',
        {
            "profile": profile,
            "password_form": password_form,
            "message": message,
            "error": error,
        }
    )


# ==================== BOOK API ====================

@csrf_exempt
def add_book(request):

    if request.method == "POST":

        data = json.loads(request.body)

        Book.objects.create(
            title=data.get("title"),
            author=data.get("author"),
            cover_image=data.get("cover", "")
        )

        return JsonResponse({
            "success": True
        })

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


@csrf_exempt
def edit_book(request, book_id):

    if request.method == "POST":

        data = json.loads(request.body)

        try:
            book = Book.objects.get(
                id=book_id
            )

        except Book.DoesNotExist:

            return JsonResponse(
                {"error": "Book not found"},
                status=404
            )

        book.title = data.get(
            "title",
            book.title
        )

        book.author = data.get(
            "author",
            book.author
        )

        book.cover_image = data.get(
            "cover",
            book.cover_image
        )

        book.save()

        return JsonResponse({
            "success": True
        })

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


@csrf_exempt
def delete_book(request, book_id):

    if request.method == "POST":

        try:
            book = Book.objects.get(
                id=book_id
            )

        except Book.DoesNotExist:

            return JsonResponse(
                {"error": "Book not found"},
                status=404
            )

        book.delete()

        return JsonResponse({
            "success": True
        })

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


def all_books(request):

    books = Book.objects.all().order_by(
        '-added_on'
    )

    data = [
        {
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "status":
                "Available"
                if b.is_available
                else
                "Borrowed",
            "cover":
                b.cover_image
                or
                "https://via.placeholder.com/60"
        }
        for b in books
    ]

    return JsonResponse({
        "books": data
    })


# ==================== MEMBER API ====================

@csrf_exempt
def add_member(request):

    if request.method == "POST":

        data = json.loads(request.body)

        username = data.get(
            "username",
            ""
        ).strip()

        password = data.get(
            "password",
            ""
        ).strip()

        linked_user = None

        if username and password:

            if User.objects.filter(
                username=username
            ).exists():

                return JsonResponse(
                    {
                        "error":
                            "That username is already taken."
                    },
                    status=400
                )

            linked_user = User.objects.create_user(
                username=username,
                password=password
            )

        Member.objects.create(
            user=linked_user,
            name=data.get("name"),
            email=data.get("email"),
            phone=data.get("phone", "")
        )

        return JsonResponse({
            "success": True
        })

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


@csrf_exempt
def delete_member(request, member_id):

    if request.method == "POST":

        try:
            member = Member.objects.get(
                id=member_id
            )

        except Member.DoesNotExist:

            return JsonResponse(
                {"error": "Member not found"},
                status=404
            )

        member.delete()

        return JsonResponse({
            "success": True
        })

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


def all_members(request):

    members = Member.objects.all().order_by(
        '-join_on'
    )

    data = [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "phone":
                m.phone
                or
                "N/A",
            "joined":
                m.join_on.strftime(
                    "%b %d, %Y"
                )
        }
        for m in members
    ]

    return JsonResponse({
        "members": data
    })


# ==================== BOOK / MEMBER DROPDOWN API ====================

def get_books_and_members(request):

    books = list(
        Book.objects
        .filter(is_available=True)
        .values(
            "id",
            "title"
        )
    )

    members = list(
        Member.objects.values(
            "id",
            "name"
        )
    )

    return JsonResponse({
        "books": books,
        "members": members
    })


# ==================== ISSUE BOOK ====================

@csrf_exempt
def issue_book(request):

    if request.method == "POST":

        data = json.loads(request.body)

        book = Book.objects.get(
            id=data.get("book_id")
        )

        member = Member.objects.get(
            id=data.get("member_id")
        )

        BorrowRecord.objects.create(
            book=book,
            member=member,
            due_date=data.get("due_date")
        )

        book.is_available = False
        book.save()

        return JsonResponse({
            "success": True
        })

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


# ==================== ACTIVE BORROWS ====================

def get_active_borrows(request):

    records = BorrowRecord.objects.filter(
        returned_on__isnull=True
    )

    data = [
        {
            "id": r.id,
            "label":
                f"{r.book.title} -> {r.member.name}"
        }
        for r in records
    ]

    return JsonResponse({
        "records": data
    })


# ==================== RETURN BOOK ====================

@csrf_exempt
def return_book(request):

    if request.method == "POST":

        data = json.loads(request.body)

        record = BorrowRecord.objects.get(
            id=data.get("record_id")
        )

        record.returned_on = timezone.now().date()
        record.save()

        record.book.is_available = True
        record.book.save()

        return JsonResponse({
            "success": True
        })

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


# ==================== DUE BOOKS ====================

def due_books(request):

    today = date.today()

    records = (
        BorrowRecord.objects
        .filter(
            returned_on__isnull=True
        )
        .select_related(
            "book",
            "member"
        )
    )

    data = []

    for r in records:

        overdue = r.due_date < today

        days = (
            (today - r.due_date).days
            if overdue
            else
            (r.due_date - today).days
        )

        data.append({
            "id": r.id,

            "book":
                r.book.title,

            "member":
                r.member.name,

            "due_date":
                r.due_date.strftime(
                    "%b %d, %Y"
                ),

            "status":
                "Overdue"
                if overdue
                else
                "Due Soon",

            "days":
                days
        })

    return JsonResponse({
        "records": data
    })

# ==================== EDIT DUE DATE ====================

@csrf_exempt
def edit_due_date(request, record_id):

    if request.method != "POST":

        return JsonResponse(
            {"error": "Invalid method"},
            status=405
        )

    try:

        data = json.loads(request.body)

        new_due_date = data.get("due_date")

        if not new_due_date:

            return JsonResponse(
                {
                    "error":
                        "Due date is required."
                },
                status=400
            )

        # Find the active borrowing record
        try:

            record = BorrowRecord.objects.get(
                id=record_id,
                returned_on__isnull=True
            )

        except BorrowRecord.DoesNotExist:

            return JsonResponse(
                {
                    "error":
                        "Active borrow record not found."
                },
                status=404
            )

        # Convert YYYY-MM-DD into a real Python date
        try:

            new_due_date = datetime.strptime(
                new_due_date,
                "%Y-%m-%d"
            ).date()

        except (ValueError, TypeError):

            return JsonResponse(
                {
                    "error":
                        "Invalid date. Please enter a valid date "
                        "in YYYY-MM-DD format."
                },
                status=400
            )

        today = date.today()

        # Rule 1: Cannot select a past date
        if new_due_date < today:

            return JsonResponse(
                {
                    "error":
                        "Due date cannot be in the past."
                },
                status=400
            )

        # Rule 2: Maximum is 14 days after the book was issued
        maximum_due_date = (
            record.borrowed_on +
            timezone.timedelta(days=14)
        )

        if new_due_date > maximum_due_date:

            return JsonResponse(
                {
                    "error":
                        "Due date cannot be more than "
                        "14 days after the issue date."
                },
                status=400
            )

        # Date passed all checks
        record.due_date = new_due_date
        record.save()

        return JsonResponse({
            "success": True,
            "due_date":
                record.due_date.strftime(
                    "%b %d, %Y"
                )
        })

    except Exception as e:

        return JsonResponse(
            {
                "error": str(e)
            },
            status=400
        )       
# ==================== REPORTS API ====================

def reports_data(request):

    today = date.today()

    total_books = Book.objects.count()

    total_members = Member.objects.count()

    total_borrowed = BorrowRecord.objects.count()

    active_borrowed = BorrowRecord.objects.filter(
        returned_on__isnull=True
    ).count()

    returned_books = BorrowRecord.objects.filter(
        returned_on__isnull=False
    ).count()

    overdue_books = BorrowRecord.objects.filter(
        returned_on__isnull=True,
        due_date__lt=today
    ).count()

    return JsonResponse({
        "total_books":
            total_books,

        "total_members":
            total_members,

        "total_borrowed":
            total_borrowed,

        "active_borrowed":
            active_borrowed,

        "returned_books":
            returned_books,

        "overdue_books":
            overdue_books,
    })


# ==================== DASHBOARD ====================

def _get_monthly_borrow_stats():

    """Returns last 6 months of borrow counts."""

    today = date.today()

    labels = []
    counts = []

    year = today.year
    month = today.month

    month_pairs = []

    for i in range(5, -1, -1):

        m = month - i
        y = year

        while m <= 0:
            m += 12
            y -= 1

        month_pairs.append(
            (y, m)
        )

    for y, m in month_pairs:

        count = BorrowRecord.objects.filter(
            borrowed_on__year=y,
            borrowed_on__month=m
        ).count()

        labels.append(
            calendar.month_abbr[m]
        )

        counts.append(
            count
        )

    return labels, counts


def _get_recent_activity():

    """Combines recent library activity."""

    events = []

    for r in (
        BorrowRecord.objects
        .select_related(
            "book",
            "member"
        )
        .order_by(
            "-borrowed_on"
        )[:8]
    ):

        events.append({
            "text":
                f'{r.member.name} borrowed '
                f'"{r.book.title}"',

            "date":
                r.borrowed_on
        })

    for r in (
        BorrowRecord.objects
        .filter(
            returned_on__isnull=False
        )
        .select_related(
            "book",
            "member"
        )
        .order_by(
            "-returned_on"
        )[:8]
    ):

        events.append({
            "text":
                f'{r.member.name} returned '
                f'"{r.book.title}"',

            "date":
                r.returned_on
        })

    for b in (
        Book.objects
        .order_by(
            "-added_on"
        )[:5]
    ):

        events.append({
            "text":
                f'"{b.title}" added to catalog',

            "date":
                b.added_on
        })

    for m in (
        Member.objects
        .order_by(
            "-join_on"
        )[:5]
    ):

        events.append({
            "text":
                f"{m.name} registered as a new member",

            "date":
                m.join_on
        })

    events.sort(
        key=lambda e: e["date"],
        reverse=True
    )

    return [
        e["text"]
        for e in events[:6]
    ]


def dashboard_data(request):

    today = date.today()

    total_books = Book.objects.count()

    total_members = Member.objects.count()

    borrowed_count = (
        BorrowRecord.objects
        .filter(
            returned_on__isnull=True
        )
        .count()
    )

    overdue_count = (
        BorrowRecord.objects
        .filter(
            returned_on__isnull=True,
            due_date__lt=today
        )
        .count()
    )

    recent_books = []

    for book in (
        Book.objects
        .order_by(
            "-added_on"
        )[:4]
    ):

        recent_books.append({
            "id":
                book.id,

            "title":
                book.title,

            "author":
                book.author,

            "status":
                "Available"
                if book.is_available
                else
                "Borrowed",

            "cover":
                book.cover_image
                or
                "https://via.placeholder.com/60"
        })

    monthly_labels, monthly_counts = (
        _get_monthly_borrow_stats()
    )

    recent_activity = (
        _get_recent_activity()
    )

    data = {
        "total_books":
            total_books,

        "total_member":
            total_members,

        "borrowed":
            borrowed_count,

        "overdue":
            overdue_count,

        "recent_books":
            recent_books,

        "monthly_labels":
            monthly_labels,

        "monthly_counts":
            monthly_counts,

        "recent_activity":
            recent_activity,
    }

    return JsonResponse(data)


# ==================== AUTHENTICATION ====================

def login_view(request):

    if request.method == "POST":

        username = request.POST.get(
            "username"
        )

        password = request.POST.get(
            "password"
        )

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:

            if not (
                user.is_staff
                or
                user.is_superuser
            ):

                return render(
                    request,
                    "login.html",
                    {
                        "error":
                            "This is the librarian login. "
                            "Members should use the member login page."
                    }
                )

            login(
                request,
                user
            )

            return redirect(
                "dashboard"
            )

        return render(
            request,
            "login.html",
            {
                "error":
                    "Invalid username or password"
            }
        )

    return render(
        request,
        "login.html"
    )


def logout_view(request):

    logout(request)

    return redirect(
        "login"
    )


# ==================== MEMBER PORTAL ====================

def member_login_view(request):

    if request.method == "POST":

        username = request.POST.get(
            "username"
        )

        password = request.POST.get(
            "password"
        )

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:

            if not hasattr(
                user,
                "member_profile"
            ):

                return render(
                    request,
                    "member_login.html",
                    {
                        "error":
                            "This account isn't registered as a member."
                    }
                )

            login(
                request,
                user
            )

            return redirect(
                "member_dashboard"
            )

        return render(
            request,
            "member_login.html",
            {
                "error":
                    "Invalid username or password"
            }
        )

    return render(
        request,
        "member_login.html"
    )


def member_logout_view(request):

    logout(request)

    return redirect(
        "member_login"
    )


def member_signup_view(request):

    if request.method == "POST":

        name = request.POST.get(
            "name",
            ""
        ).strip()

        email = request.POST.get(
            "email",
            ""
        ).strip()

        phone = request.POST.get(
            "phone",
            ""
        ).strip()

        username = request.POST.get(
            "username",
            ""
        ).strip()

        password = request.POST.get(
            "password",
            ""
        ).strip()

        if not (
            name
            and
            email
            and
            username
            and
            password
        ):

            return render(
                request,
                "member_signup.html",
                {
                    "error":
                        "Please fill in all required fields."
                }
            )

        if User.objects.filter(
            username=username
        ).exists():

            return render(
                request,
                "member_signup.html",
                {
                    "error":
                        "That username is already taken."
                }
            )

        if Member.objects.filter(
            email=email
        ).exists():

            return render(
                request,
                "member_signup.html",
                {
                    "error":
                        "An account with that email already exists."
                }
            )

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email
        )

        Member.objects.create(
            user=user,
            name=name,
            email=email,
            phone=phone
        )

        login(
            request,
            user
        )

        return redirect(
            "member_dashboard"
        )

    return render(
        request,
        "member_signup.html"
    )


@member_required
def member_dashboard_view(request):

    member = request.user.member_profile

    today = date.today()

    active_records = (
        BorrowRecord.objects
        .filter(
            member=member,
            returned_on__isnull=True
        )
        .select_related(
            "book"
        )
    )

    history_records = (
        BorrowRecord.objects
        .filter(
            member=member,
            returned_on__isnull=False
        )
        .select_related(
            "book"
        )
        .order_by(
            "-returned_on"
        )
    )

    active_books = []

    for r in active_records:

        overdue = r.due_date < today

        active_books.append({
            "title":
                r.book.title,

            "author":
                r.book.author,

            "cover":
                r.book.cover_image
                or
                "https://via.placeholder.com/60",

            "due_date":
                r.due_date.strftime(
                    "%b %d, %Y"
                ),

            "overdue":
                overdue,
        })

    history = []

    for r in history_records:

        history.append({
            "title":
                r.book.title,

            "borrowed_on":
                r.borrowed_on.strftime(
                    "%b %d, %Y"
                ),

            "returned_on":
                r.returned_on.strftime(
                    "%b %d, %Y"
                ),
        })

    return render(
        request,
        "member_dashboard.html",
        {
            "member":
                member,

            "active_books":
                active_books,

            "history":
                history,
        }
    )


@member_required
def member_settings_view(request):

    member = request.user.member_profile

    password_form = PasswordChangeForm(
        user=request.user
    )

    message = None
    error = None

    if request.method == "POST":

        form_type = request.POST.get(
            "form_type"
        )

        if form_type == "profile_info":

            new_name = request.POST.get(
                "name",
                ""
            ).strip()

            new_phone = request.POST.get(
                "phone",
                ""
            ).strip()

            if new_name:

                member.name = new_name
                member.phone = new_phone

                member.save()

            message = (
                "Profile updated successfully!"
            )

        elif form_type == "change_password":

            password_form = PasswordChangeForm(
                user=request.user,
                data=request.POST
            )

            if password_form.is_valid():

                user = password_form.save()

                update_session_auth_hash(
                    request,
                    user
                )

                message = (
                    "Password changed successfully!"
                )

                password_form = (
                    PasswordChangeForm(
                        user=request.user
                    )
                )

            else:

                error = (
                    "Please fix the errors below."
                )

    return render(
        request,
        "member_settings.html",
        {
            "member":
                member,

            "password_form":
                password_form,

            "message":
                message,

            "error":
                error,
        }
    )
