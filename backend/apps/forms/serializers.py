import re
from rest_framework import serializers
from apps.forms.models import Form, Submission


class FormSettingsSerializer(serializers.Serializer):
    welcomeMessage = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')
    completionMessage = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')
    primaryColor = serializers.CharField(max_length=32, required=False, default='#2563eb')
    submitLabel = serializers.CharField(max_length=64, required=False, default='Submit Form')


class QuestionSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=64, required=True)
    type = serializers.ChoiceField(choices=['text', 'email', 'multiple_choice', 'yes_no'])
    label = serializers.CharField(max_length=300, required=True)
    placeholder = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    required = serializers.BooleanField(default=False)
    options = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False,
        default=list,
    )
    order = serializers.IntegerField(default=1)


class FormListSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    total_submissions = serializers.SerializerMethodField()

    class Meta:
        model = Form
        fields = [
            'id',
            'public_id',
            'title',
            'description',
            'status',
            'questions',
            'settings',
            'question_count',
            'total_submissions',
            'created_at',
            'updated_at',
        ]

    def get_question_count(self, obj):
        return len(obj.questions) if isinstance(obj.questions, list) else 0

    def get_total_submissions(self, obj):
        # Use annotation if available, otherwise query count
        if hasattr(obj, 'submission_count'):
            return obj.submission_count
        return obj.submissions.count()


class FormDetailSerializer(serializers.ModelSerializer):
    total_submissions = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Form
        fields = [
            'id',
            'public_id',
            'title',
            'description',
            'status',
            'questions',
            'settings',
            'total_submissions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_submissions']
        extra_kwargs = {
            'public_id': {'required': False, 'allow_blank': True},
        }

    def get_total_submissions(self, obj):
        return obj.submissions.count()

    def validate_questions(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Questions must be a list of question objects.")
        # Ensure each question has minimum valid structure
        for idx, q in enumerate(value):
            if not isinstance(q, dict):
                raise serializers.ValidationError(f"Question at index {idx} must be an object.")
            if 'id' not in q or 'type' not in q or 'label' not in q:
                raise serializers.ValidationError(f"Question at index {idx} requires 'id', 'type', and 'label'.")
            if q['type'] not in ['text', 'email', 'multiple_choice', 'yes_no']:
                raise serializers.ValidationError(f"Invalid question type '{q['type']}' at index {idx}.")
        return value

    def create(self, validated_data):
        # Automatically assign requesting user if authenticated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)


class PublicFormSerializer(serializers.ModelSerializer):
    """Safe schema representation for public respondents and chatbot widget"""
    class Meta:
        model = Form
        fields = [
            'id',
            'public_id',
            'title',
            'description',
            'status',
            'questions',
            'settings',
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    form_title = serializers.CharField(source='form.title', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id',
            'form',
            'form_title',
            'submitted_at',
            'answers',
        ]
        read_only_fields = ['id', 'submitted_at', 'form_title']


class SubmissionCreateSerializer(serializers.Serializer):
    answers = serializers.DictField(
        child=serializers.CharField(allow_blank=True),
        required=True,
    )

    def validate(self, data):
        form = self.context.get('form')
        if not form:
            raise serializers.ValidationError("Target form context missing.")

        if form.status != 'published':
            raise serializers.ValidationError("This form is currently not accepting submissions.")

        answers = data.get('answers', {})
        email_regex = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

        # Validate answers against configured form questions
        for q in form.questions:
            q_id = q.get('id')
            q_label = q.get('label', 'Question')
            q_required = q.get('required', False)
            q_type = q.get('type')

            val = answers.get(q_id, '').strip()

            # Required field check
            if q_required and not val:
                raise serializers.ValidationError({
                    q_id: f"'{q_label}' is required."
                })

            # Email format validation
            if q_type == 'email' and val:
                if not email_regex.match(val):
                    raise serializers.ValidationError({
                        q_id: f"Please provide a valid email address for '{q_label}'."
                    })

        return data

    def create(self, validated_data):
        form = self.context['form']
        submission = Submission.objects.create(
            form=form,
            answers=validated_data['answers'],
        )
        return submission
