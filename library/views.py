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


def librarian_required(view_func):
    """Only allows staff/superuser accounts in — regular members get sent to their own portal."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        if not (request.user.is_staff or request.user.is_superuser):
            return redirect('member_dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper


def member_required(view_func):
    """Only allows accounts linked to a Member — librarians get sent to the admin dashboard."""
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
    profile, _created = Profile.objects.get_or_create(user=request.user)
    return render(request, 'index.html', {"profile": profile})


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
    profile, _created = Profile.objects.get_or_create(user=request.user)
    password_form = PasswordChangeForm(user=request.user)
    message = None
    error = None

    if request.method == "POST":
        form_type = request.POST.get("form_type")

        if form_type == "profile_info":
            new_username = request.POST.get("username", "").strip()

            if new_username:
                request.user.username = new_username
                request.user.save()

            if request.FILES.get("profile_picture"):
                profile.profile_picture = request.FILES["profile_picture"]

            profile.save()
            message = "Profile updated successfully!"

        elif form_type == "change_password":
            password_form = PasswordChangeForm(
                user=request.user,
                data=request.POST
            )

            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)

                message = "Password changed successfully!"
                password_form = PasswordChangeForm(user=request.user)

            else:
                error = "Please fix the errors below."

    return render(request, 'settings.html', {
        "profile": profile,
        "password_form": password_form,
        "message": message,
        "error": error,
    })


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

        return JsonResponse({"success": True})

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


@csrf_exempt
def edit_book(request, book_id):
    if request.method == "POST":
        data = json.loads(request.body)

        try:
            book = Book.objects.get(id=book_id)

        except Book.DoesNotExist:
            return JsonResponse(
                {"error": "Book not found"},
                status=404
            )

        book.title = data.get("title", book.title)
        book.author = data.get("author", book.author)
        book.cover_image = data.get(
            "cover",
            book.cover_image
        )

        book.save()

        return JsonResponse({"success": True})

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


@csrf_exempt
def delete_book(request, book_id):
    if request.method == "POST":
        try:
            book = Book.objects.get(id=book_id)

        except Book.DoesNotExist:
            return JsonResponse(
                {"error": "Book not found"},
                status=404
            )

        book.delete()

        return JsonResponse({"success": True})

    return JsonResponse(
        {"error": "Invalid method"},
        status=405
    )


def all_books(request):
    books = Book.objects.all().order_by('-added_on')

    data = [
        {
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "status": "Available" if b.is_available else "Borrowed",
            "cover": b.cover_image or "https://via.placeholder.com/60"
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
                        "error": "That username is already taken."
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
            member = Member.objects.get(id=member_id)

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
    members = Member.objects.all().order_by('-join_on')

    data = [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "phone": m.phone or "N/A",
            "joined": m.join_on.strftime("%b %d, %Y")
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
        .values("id", "title")
    )

    members = list(
        Member.objects.values("id", "name")
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
            "label": f"{r.book.title} -> {r.member.name}"
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
        .filter(returned_on__isnull=True)
        .select_related("book", "member")
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
            "book": r.book.title,
            "member": r.member.name,
            "due_date": r.due_date.strftime(
                "%b %d, %Y"
            ),
            "status": (
                "Overdue"
                if overdue
                else
                "Due Soon"
            ),
            "days": days
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
                    "error": "Due date is required."
                },
                status=400
            )


        record = BorrowRecord.objects.get(
            id=record_id,
            returned_on__isnull=True
        )


        # Convert JavaScript string
        #
