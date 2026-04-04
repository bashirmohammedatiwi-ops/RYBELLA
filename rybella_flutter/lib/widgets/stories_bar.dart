import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart' show Ticker;
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';

import '../core/config.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import 'app_image.dart';

/// اليوميات — شريط أفقي + عارض بصفحات، تقدّم، فيديو، إيقاف، تمرير بين المجموعات
class StoriesBar extends StatefulWidget {
  const StoriesBar({super.key});

  @override
  State<StoriesBar> createState() => _StoriesBarState();
}

class _StoriesBarState extends State<StoriesBar> {
  static const _viewedKey = 'rybella_stories_viewed_v1';

  List<Map<String, dynamic>> _groups = [];
  bool _loading = true;
  final Set<String> _viewedIds = {};

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList(_viewedKey);
    if (stored != null && mounted) {
      setState(() => _viewedIds.addAll(stored));
    }
    await _load();
  }

  Future<void> _persistViewed(String id) async {
    if (id.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_viewedKey, _viewedIds.toList());
  }

  Future<void> _load() async {
    try {
      final res = await ApiService.getStories();
      if (mounted) {
        setState(() {
          _groups = res;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _markViewed(String id) {
    if (id.isEmpty) return;
    setState(() => _viewedIds.add(id));
    unawaited(_persistViewed(id));
  }

  String _imgUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '${AppConfig.imgBase}$path';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        child: Row(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey.shade200,
              ),
              child: const Center(
                child: SizedBox(
                  width: 26,
                  height: 26,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'اليوميات',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }
    if (_groups.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'اليوميات',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppTheme.textSecondary.withValues(alpha: 0.9),
              ),
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _groups.length,
              itemBuilder: (_, i) {
                final g = _groups[i];
                final id = g['id']?.toString() ?? '';
                final viewed = _viewedIds.contains(id);
                final avatar = g['avatar'] ??
                    (g['cover_media_type'] != 'video' ? g['cover'] : null);
                final name = g['publisher_name']?.toString() ?? '';

                return Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => _openViewer(i),
                      borderRadius: BorderRadius.circular(40),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 74,
                            height: 74,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: viewed
                                  ? const LinearGradient(
                                      colors: [
                                        Color(0xFF9E9E9E),
                                        Color(0xFFBDBDBD),
                                      ],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    )
                                  : const LinearGradient(
                                      colors: [
                                        AppTheme.primary,
                                        AppTheme.primaryLight,
                                        AppTheme.primaryDark,
                                      ],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primary.withValues(alpha: 0.28),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            padding: const EdgeInsets.all(3),
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                              ),
                              padding: const EdgeInsets.all(2),
                              child: ClipOval(
                                child: avatar != null &&
                                        avatar.toString().isNotEmpty
                                    ? AppImage(
                                        url: _imgUrl(avatar.toString()),
                                        fit: BoxFit.cover,
                                        width: 64,
                                        height: 64,
                                      )
                                    : Container(
                                        color: const Color(0xFF2C2C2C),
                                        child: const Center(
                                          child: Icon(
                                            Icons.play_arrow_rounded,
                                            color: Colors.white,
                                            size: 32,
                                          ),
                                        ),
                                      ),
                              ),
                            ),
                          ),
                          if (name.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            SizedBox(
                              width: 76,
                              child: Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _openViewer(int index) {
    Navigator.of(context).push(
      PageRouteBuilder<void>(
        opaque: true,
        barrierColor: Colors.black,
        pageBuilder: (context, animation, secondaryAnimation) => _StoryViewerScreen(
          groups: _groups,
          initialIndex: index,
          imgBase: AppConfig.imgBase,
          onViewed: _markViewed,
        ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
            ),
            child: child,
          );
        },
      ),
    );
  }
}

// ─── عارض ملء الشاشة ───

class _StoryViewerScreen extends StatefulWidget {
  final List<Map<String, dynamic>> groups;
  final int initialIndex;
  final String imgBase;
  final void Function(String id) onViewed;

  const _StoryViewerScreen({
    required this.groups,
    required this.initialIndex,
    required this.imgBase,
    required this.onViewed,
  });

  @override
  State<_StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<_StoryViewerScreen>
    with SingleTickerProviderStateMixin {
  late int _groupIndex;
  late int _slideIndex;
  double _progress = 0;
  bool _paused = false;

  /// مزامنة مع إطارات العرض — تقدّم سلس بدل زيادات ثابتة
  Ticker? _imageTicker;

  /// ساعة حقيقية للصور: مدة الشريحة + استئناف بعد الإيقاف بدون قفزات
  int _slideStartEpochMs = 0;
  int _totalMsThisSlide = 5000;
  int _imageElapsedMs = 0;

  late final PageController _pageController;

  List<Map<String, dynamic>> get _slides =>
      (widget.groups[_groupIndex]['slides'] as List?)
          ?.cast<Map<String, dynamic>>() ??
      [];

  Map<String, dynamic>? get _currentSlide {
    final s = _slides;
    if (s.isEmpty || _slideIndex >= s.length) return null;
    return s[_slideIndex];
  }

  Map<String, dynamic> get _currentGroup => widget.groups[_groupIndex];

  int _groupDurationSec() => (_currentGroup['duration_seconds'] as num?)?.toInt() ?? 5;

  int _slideDurationSec(Map<String, dynamic> slide) {
    final v = slide['duration_seconds'] ?? slide['duration'];
    if (v is int) return v.clamp(1, 120);
    if (v is num) return v.toInt().clamp(1, 120);
    return _groupDurationSec().clamp(1, 120);
  }

  bool _isVideoSlide(Map<String, dynamic>? slide) =>
      slide != null && slide['media_type'] == 'video';

  String _mediaUrl(Map<String, dynamic> slide) {
    final raw = slide['video'] ?? slide['image'] ?? slide['url'] ?? '';
    final s = raw.toString();
    if (s.isEmpty) return '';
    if (s.startsWith('http')) return s;
    return '${widget.imgBase}$s';
  }

  @override
  void initState() {
    super.initState();
    _groupIndex = widget.initialIndex.clamp(0, widget.groups.length - 1);
    _slideIndex = 0;
    _pageController = PageController(initialPage: _groupIndex);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      widget.onViewed(_currentGroup['id']?.toString() ?? '');
      _restartImageProgress();
    });
  }

  void _disposeImageTicker() {
    _imageTicker?.dispose();
    _imageTicker = null;
  }

  /// يعيد ضبط المؤقت للشرائح الصورية فقط (الفيديو يعتمد على المشغّل)
  void _restartImageProgress() {
    _disposeImageTicker();
    if (_paused) return;
    final slide = _currentSlide;
    if (slide == null) return;
    if (_isVideoSlide(slide)) return;

    _startImageTicker(resetElapsed: true);
  }

  void _startImageTicker({required bool resetElapsed}) {
    final slide = _currentSlide;
    if (slide == null || _paused) return;
    if (_isVideoSlide(slide)) return;

    _totalMsThisSlide = (_slideDurationSec(slide) * 1000).clamp(1, 120000);

    if (resetElapsed) {
      _slideStartEpochMs = DateTime.now().millisecondsSinceEpoch;
      _imageElapsedMs = 0;
      if (mounted) setState(() => _progress = 0);
    } else {
      _slideStartEpochMs = DateTime.now().millisecondsSinceEpoch -
          _imageElapsedMs.clamp(0, _totalMsThisSlide);
    }

    _disposeImageTicker();
    _imageTicker = createTicker(_onImageTick)..start();
  }

  void _onImageTick(Duration _) {
    if (!mounted || _paused) return;
    final slide = _currentSlide;
    if (slide == null || _isVideoSlide(slide)) return;

    final elapsed = DateTime.now().millisecondsSinceEpoch - _slideStartEpochMs;
    if (elapsed >= _totalMsThisSlide) {
      _disposeImageTicker();
      _goNextSlideOrGroup();
      return;
    }
    setState(() {
      _progress = (elapsed / _totalMsThisSlide * 100).clamp(0.0, 100.0);
    });
  }

  void _goNextSlideOrGroup() {
    final slides = _slides;
    if (_slideIndex < slides.length - 1) {
      setState(() => _slideIndex++);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _restartImageProgress();
      });
    } else if (_groupIndex < widget.groups.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    } else {
      Navigator.of(context).pop();
    }
  }

  void _goPrevSlideOrGroup() {
    if (_slideIndex > 0) {
      setState(() => _slideIndex--);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _restartImageProgress();
      });
    } else if (_groupIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    } else {
      Navigator.of(context).pop();
    }
  }

  void _onPageChanged(int page) {
    final old = _groupIndex;
    final forward = page > old;
    setState(() {
      _groupIndex = page;
      final sl = _slides;
      if (forward) {
        _slideIndex = 0;
      } else {
        _slideIndex = sl.isEmpty ? 0 : sl.length - 1;
      }
      _progress = 0;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      widget.onViewed(_currentGroup['id']?.toString() ?? '');
      _restartImageProgress();
    });
  }

  void _togglePause() {
    HapticFeedback.selectionClick();
    if (!_paused) {
      final slide = _currentSlide;
      if (slide != null && !_isVideoSlide(slide)) {
        _imageElapsedMs = (DateTime.now().millisecondsSinceEpoch - _slideStartEpochMs)
            .clamp(0, _totalMsThisSlide);
        _disposeImageTicker();
        setState(() {
          _paused = true;
          _progress = (_imageElapsedMs / _totalMsThisSlide * 100);
        });
        return;
      }
      setState(() => _paused = true);
      return;
    }
    setState(() => _paused = false);
    final slide = _currentSlide;
    if (slide != null && !_isVideoSlide(slide)) {
      _startImageTicker(resetElapsed: false);
    }
  }

  void _setPausedHold(bool v) {
    if (_paused == v) return;
    HapticFeedback.lightImpact();
    if (v) {
      final slide = _currentSlide;
      if (slide != null && !_isVideoSlide(slide)) {
        _imageElapsedMs = (DateTime.now().millisecondsSinceEpoch - _slideStartEpochMs)
            .clamp(0, _totalMsThisSlide);
        _disposeImageTicker();
        setState(() {
          _paused = true;
          _progress = (_imageElapsedMs / _totalMsThisSlide * 100);
        });
        return;
      }
      setState(() => _paused = true);
      return;
    }
    setState(() => _paused = false);
    final slide = _currentSlide;
    if (slide != null && !_isVideoSlide(slide)) {
      _startImageTicker(resetElapsed: false);
    }
  }

  Future<void> _openLink(String url) async {
    final u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) {
      final uri = Uri.tryParse(u);
      if (uri != null && await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      return;
    }
    if (!mounted) return;
    Navigator.of(context).pop();
    if (u.startsWith('/products/')) {
      final id = int.tryParse(u.replaceFirst('/products/', ''));
      if (id != null) context.push('/products/$id');
    } else if (u.startsWith('/explore')) {
      context.push(u);
    }
  }

  @override
  void dispose() {
    _disposeImageTicker();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slide = _currentSlide;
    if (slide == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.of(context).pop();
      });
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text(
            'لا يوجد محتوى',
            style: TextStyle(color: Colors.white70),
          ),
        ),
      );
    }

    final slides = _slides;
    final segCount = slides.length;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          GestureDetector(
            onVerticalDragEnd: (d) {
              final v = d.primaryVelocity ?? 0;
              if (v > 380) Navigator.of(context).pop();
            },
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: _onPageChanged,
              itemCount: widget.groups.length,
              itemBuilder: (context, pageIndex) {
                return _StoryPageLayer(
                  groups: widget.groups,
                  pageIndex: pageIndex,
                  activeGroupIndex: _groupIndex,
                  slideIndex: _slideIndex,
                  imgBase: widget.imgBase,
                  paused: _paused,
                  onVideoProgress: pageIndex == _groupIndex
                      ? (p) {
                          if (mounted) setState(() => _progress = p);
                        }
                      : (_) {},
                  onVideoEnded: pageIndex == _groupIndex
                      ? () {
                          if (!mounted) return;
                          _goNextSlideOrGroup();
                        }
                      : () {},
                );
              },
            ),
          ),
          Positioned.fill(
            child: Row(
              children: [
                Expanded(
                  flex: 24,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _goPrevSlideOrGroup();
                    },
                    onLongPressStart: (_) => _setPausedHold(true),
                    onLongPressEnd: (_) => _setPausedHold(false),
                  ),
                ),
                const Expanded(
                  flex: 52,
                  child: IgnorePointer(child: SizedBox.expand()),
                ),
                Expanded(
                  flex: 24,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _goNextSlideOrGroup();
                    },
                    onLongPressStart: (_) => _setPausedHold(true),
                    onLongPressEnd: (_) => _setPausedHold(false),
                  ),
                ),
              ],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 6, 10, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (segCount > 0)
                    Row(
                      children: List.generate(segCount, (i) {
                        double fill;
                        if (i < _slideIndex) {
                          fill = 1;
                        } else if (i == _slideIndex) {
                          fill = (_progress / 100).clamp(0.0, 1.0);
                        } else {
                          fill = 0;
                        }
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(2),
                              child: LinearProgressIndicator(
                                value: fill,
                                minHeight: 3,
                                backgroundColor: Colors.white.withValues(alpha: 0.28),
                                color: Colors.white,
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (_currentGroup['avatar'] != null ||
                          _currentGroup['cover'] != null)
                        ClipOval(
                          child: AppImage(
                            url: _mediaUrl({
                              'image': _currentGroup['avatar'] ??
                                  _currentGroup['cover'],
                            }),
                            width: 36,
                            height: 36,
                            fit: BoxFit.cover,
                          ),
                        ),
                      if (_currentGroup['avatar'] != null ||
                          _currentGroup['cover'] != null)
                        const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentGroup['publisher_name']?.toString() ?? '',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (slide['caption'] != null &&
                                slide['caption'].toString().isNotEmpty)
                              Text(
                                slide['caption'].toString(),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.85),
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ),
                      if (!_isVideoSlide(slide))
                        Text(
                          '${_slideDurationSec(slide)} ث',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 13,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 8,
            left: 8,
            right: 8,
            child: SafeArea(
              child: Row(
                children: [
                  Material(
                    color: Colors.black38,
                    shape: const CircleBorder(),
                    child: IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                  const Spacer(),
                  Material(
                    color: Colors.black38,
                    shape: const CircleBorder(),
                    child: IconButton(
                      icon: Icon(
                        _paused ? Icons.play_arrow_rounded : Icons.pause_rounded,
                        color: Colors.white,
                      ),
                      onPressed: _togglePause,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (slide['link_url'] != null &&
              slide['link_url'].toString().isNotEmpty)
            Positioned(
              bottom: 28,
              left: 16,
              right: 16,
              child: SafeArea(
                top: false,
                child: Center(
                  child: Material(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.circular(26),
                    elevation: 6,
                    shadowColor: AppTheme.primary.withValues(alpha: 0.45),
                    child: InkWell(
                      onTap: () => _openLink(slide['link_url'].toString()),
                      borderRadius: BorderRadius.circular(26),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.open_in_new_rounded,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              slide['link_label']?.toString().isNotEmpty == true
                                  ? slide['link_label'].toString()
                                  : 'عرض المنتج / الرابط',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          Positioned(
            bottom: 8,
            left: 0,
            right: 0,
            child: SafeArea(
              top: false,
              child: Text(
                'اسحبي للأسفل للإغلاق • اسحبي يمين/يسار بين الحسابات',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 11,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// طبقة صفحة واحدة (مجموعة) — فيديو أو صورة
class _StoryPageLayer extends StatelessWidget {
  final List<Map<String, dynamic>> groups;
  final int pageIndex;
  final int activeGroupIndex;
  final int slideIndex;
  final String imgBase;
  final bool paused;
  final void Function(double) onVideoProgress;
  final VoidCallback onVideoEnded;

  const _StoryPageLayer({
    required this.groups,
    required this.pageIndex,
    required this.activeGroupIndex,
    required this.slideIndex,
    required this.imgBase,
    required this.paused,
    required this.onVideoProgress,
    required this.onVideoEnded,
  });

  String _url(Map<String, dynamic> slide) {
    final raw = slide['video'] ?? slide['image'] ?? slide['url'] ?? '';
    final s = raw.toString();
    if (s.isEmpty) return '';
    if (s.startsWith('http')) return s;
    return '$imgBase$s';
  }

  @override
  Widget build(BuildContext context) {
    final g = groups[pageIndex];
    final slides =
        (g['slides'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final si = pageIndex == activeGroupIndex ? slideIndex : 0;
    final slide = slides.isEmpty
        ? null
        : slides[si.clamp(0, slides.length - 1)];
    final active = pageIndex == activeGroupIndex;

    if (slide == null) {
      return const ColoredBox(color: Colors.black);
    }

    final isVideo = slide['media_type'] == 'video';

    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: AspectRatio(
          aspectRatio: 9 / 16,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: isVideo && active
                ? _StoryVideoPlayer(
                    key: ValueKey(
                      '${pageIndex}_${si}_${slide['id'] ?? slide['image']}',
                    ),
                    url: _url(slide),
                    paused: paused,
                    onProgress: onVideoProgress,
                    onEnded: onVideoEnded,
                  )
                : isVideo && !active
                    ? _VideoInactivePlaceholder(
                        posterUrl: _url({
                          'image': slide['poster'] ?? slide['image'] ?? '',
                        }),
                      )
                    : AppImage(
                        url: _url(slide),
                        fit: BoxFit.contain,
                      ),
          ),
        ),
      ),
    );
  }
}

class _VideoInactivePlaceholder extends StatelessWidget {
  final String posterUrl;

  const _VideoInactivePlaceholder({required this.posterUrl});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (posterUrl.isNotEmpty)
          AppImage(url: posterUrl, fit: BoxFit.cover)
        else
          const ColoredBox(color: Color(0xFF1A1A1A)),
        Center(
          child: Icon(
            Icons.play_circle_filled_rounded,
            size: 64,
            color: Colors.white.withValues(alpha: 0.85),
          ),
        ),
      ],
    );
  }
}

class _StoryVideoPlayer extends StatefulWidget {
  final String url;
  final bool paused;
  final void Function(double progress) onProgress;
  final VoidCallback onEnded;

  const _StoryVideoPlayer({
    super.key,
    required this.url,
    required this.paused,
    required this.onProgress,
    required this.onEnded,
  });

  @override
  State<_StoryVideoPlayer> createState() => _StoryVideoPlayerState();
}

class _StoryVideoPlayerState extends State<_StoryVideoPlayer> {
  VideoPlayerController? _c;
  bool _failed = false;
  bool _ended = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    if (widget.url.isEmpty) {
      setState(() => _failed = true);
      return;
    }
    final uri = Uri.tryParse(widget.url);
    if (uri == null) {
      setState(() => _failed = true);
      return;
    }
    final controller = VideoPlayerController.networkUrl(uri);
    try {
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      _c = controller;
      controller.addListener(_tick);
      if (!widget.paused) {
        await controller.play();
      }
      setState(() {});
    } catch (_) {
      await controller.dispose();
      if (mounted) setState(() => _failed = true);
    }
  }

  void _tick() {
    final c = _c;
    if (c == null || !c.value.isInitialized || _ended) return;
    final d = c.value.duration;
    final p = c.value.position;
    if (d.inMilliseconds > 0) {
      widget.onProgress((p.inMilliseconds / d.inMilliseconds) * 100);
    }
    if (d > Duration.zero &&
        p >= d - const Duration(milliseconds: 120)) {
      _ended = true;
      c.removeListener(_tick);
      widget.onEnded();
    }
  }

  @override
  void didUpdateWidget(covariant _StoryVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    final c = _c;
    if (c != null && c.value.isInitialized) {
      if (widget.paused && c.value.isPlaying) {
        c.pause();
      } else if (!widget.paused && !c.value.isPlaying) {
        c.play();
      }
    }
  }

  @override
  void dispose() {
    _c?.removeListener(_tick);
    _c?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_failed || _c == null || !_c!.value.isInitialized) {
      return Center(
        child: _failed
            ? const Text(
                'تعذّر تشغيل الفيديو',
                style: TextStyle(color: Colors.white70),
              )
            : const CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 2,
              ),
      );
    }
    return FittedBox(
      fit: BoxFit.contain,
      child: SizedBox(
        width: _c!.value.size.width,
        height: _c!.value.size.height,
        child: VideoPlayer(_c!),
      ),
    );
  }
}
