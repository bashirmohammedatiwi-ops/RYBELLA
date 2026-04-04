import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme.dart';
import '../core/config.dart';
import '../services/api_service.dart';
import 'app_image.dart';

/// اليوميات - شريط أفقي مثل انستغرام
class StoriesBar extends StatefulWidget {
  const StoriesBar({super.key});

  @override
  State<StoriesBar> createState() => _StoriesBarState();
}

class _StoriesBarState extends State<StoriesBar> {
  List<Map<String, dynamic>> _groups = [];
  bool _loading = true;
  final Set<String> _viewedIds = {};
  static const _viewedKey = 'rybella_stories_viewed';

  @override
  void initState() {
    super.initState();
    _loadViewed();
    _load();
  }

  void _loadViewed() {
    // يمكن استخدام shared_preferences لاحقاً
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
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        child: Row(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey.shade200,
              ),
              child: const Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))),
            ),
            const SizedBox(width: 12),
            Text('اليوميات', style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
          ],
        ),
      );
    }
    if (_groups.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 96,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _groups.length,
              itemBuilder: (_, i) {
                final g = _groups[i];
                final id = g['id']?.toString() ?? '';
                final viewed = _viewedIds.contains(id);
                final avatar = g['avatar'] ?? (g['cover_media_type'] != 'video' ? g['cover'] : null);
                final name = g['publisher_name']?.toString() ?? '';

                return Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: GestureDetector(
                    onTap: () => _openViewer(i),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: viewed
                                ? const LinearGradient(
                                    colors: [Color(0xFF888888), Color(0xFFAAAAAA)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  )
                                : const LinearGradient(
                                    colors: [AppTheme.primary, AppTheme.primaryLight, AppTheme.primary],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
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
                              child: avatar != null && avatar.toString().isNotEmpty
                                  ? AppImage(
                                      url: _imgUrl(avatar.toString()),
                                      fit: BoxFit.cover,
                                      width: 64,
                                      height: 64,
                                    )
                                  : Container(
                                      color: const Color(0xFF333333),
                                      child: const Center(
                                        child: Text('▶', style: TextStyle(color: Colors.white, fontSize: 24)),
                                      ),
                                    ),
                            ),
                          ),
                        ),
                        if (name.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          SizedBox(
                            width: 72,
                            child: Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ),
                        ],
                      ],
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
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => _StoryViewerScreen(
          groups: _groups,
          initialIndex: index,
          imgBase: AppConfig.imgBase,
          onViewed: (id) => setState(() => _viewedIds.add(id)),
        ),
      ),
    );
  }
}

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

class _StoryViewerScreenState extends State<_StoryViewerScreen> {
  late int _groupIndex;
  late int _slideIndex;
  double _progress = 0;
  Timer? _timer;
  bool _paused = false;

  List<Map<String, dynamic>> get _slides =>
      (widget.groups[_groupIndex]['slides'] as List?)?.cast<Map<String, dynamic>>() ?? [];

  Map<String, dynamic>? get _currentSlide {
    final s = _slides;
    if (_slideIndex >= s.length) return null;
    return s[_slideIndex];
  }

  Map<String, dynamic> get _currentGroup => widget.groups[_groupIndex];

  int get _durationSec => _currentGroup['duration_seconds'] ?? 5;

  @override
  void initState() {
    super.initState();
    _groupIndex = widget.initialIndex;
    _slideIndex = 0;
    widget.onViewed(_currentGroup['id']?.toString() ?? '');
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    if (_paused) return;
    final duration = _durationSec * 1000;
    final step = duration / 50;
    _timer = Timer.periodic(Duration(milliseconds: step.round()), (_) {
      if (!mounted || _paused) return;
      setState(() {
        _progress += 2;
        if (_progress >= 100) {
          _progress = 0;
          _next();
        }
      });
    });
  }

  void _next() {
    final slides = _slides;
    if (_slideIndex < slides.length - 1) {
      setState(() => _slideIndex++);
    } else if (_groupIndex < widget.groups.length - 1) {
      setState(() {
        _groupIndex++;
        _slideIndex = 0;
        widget.onViewed(widget.groups[_groupIndex]['id']?.toString() ?? '');
      });
    } else {
      Navigator.of(context).pop();
    }
  }

  void _prev() {
    if (_slideIndex > 0) {
      setState(() => _slideIndex--);
    } else if (_groupIndex > 0) {
      setState(() {
        _groupIndex--;
        _slideIndex = (widget.groups[_groupIndex]['slides'] as List?)?.length ?? 0;
        _slideIndex = (_slideIndex > 0) ? _slideIndex - 1 : 0;
      });
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _img(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '${widget.imgBase}$path';
  }

  @override
  Widget build(BuildContext context) {
    final slide = _currentSlide;
    if (slide == null) {
      Navigator.of(context).pop();
      return const SizedBox.shrink();
    }

    final allSlides = widget.groups.expand((g) => (g['slides'] as List?)?.cast<Map<String, dynamic>>() ?? []).toList();
    int segIdx = 0;
    for (int i = 0; i < _groupIndex; i++) {
      segIdx += (widget.groups[i]['slides'] as List?)?.length ?? 0;
    }
    segIdx += _slideIndex;

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: (d) {
          final w = MediaQuery.of(context).size.width;
          if (d.localPosition.dx < w * 0.33) {
            _prev();
          } else if (d.localPosition.dx > w * 0.66) {
            _next();
          }
        },
        onVerticalDragEnd: (d) {
          if (d.velocity.pixelsPerSecond.dy > 300) Navigator.of(context).pop();
        },
        child: Stack(
          children: [
            Center(
              child: AspectRatio(
                aspectRatio: 9 / 16,
                child: slide['media_type'] == 'video'
                    ? const Center(child: Text('فيديو', style: TextStyle(color: Colors.white)))
                    : AppImage(url: _img(slide['image']?.toString()), fit: BoxFit.contain),
              ),
            ),
            SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: allSlides.asMap().entries.map((e) {
                        final fill = e.key < segIdx
                            ? 1.0
                            : e.key == segIdx
                                ? _progress / 100
                                : 0.0;
                        return Expanded(
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            height: 3,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(2),
                            ),
                            child: LayoutBuilder(
                              builder: (_, c) => Align(
                                alignment: Alignment.centerLeft,
                                widthFactor: fill.clamp(0.0, 1.0),
                                child: Container(
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      children: [
                        if (_currentGroup['avatar'] != null || _currentGroup['cover'] != null)
                          CircleAvatar(
                            radius: 16,
                            backgroundImage: NetworkImage(_img(_currentGroup['avatar'] ?? _currentGroup['cover'])),
                          ),
                        if (_currentGroup['avatar'] != null || _currentGroup['cover'] != null) const SizedBox(width: 8),
                        Text(
                          _currentGroup['publisher_name']?.toString() ?? '',
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                        const Spacer(),
                        Text(
                          '$_durationSec ث',
                          style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              top: 12,
              right: 12,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 28),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            if (slide['link_url'] != null && slide['link_url'].toString().isNotEmpty)
              Positioned(
                bottom: 24,
                left: 0,
                right: 0,
                child: Center(
                  child: GestureDetector(
                    onTap: () {
                      final url = slide['link_url'].toString();
                      Navigator.of(context).pop();
                      if (url.startsWith('/products/')) {
                        final id = int.tryParse(url.replaceFirst('/products/', ''));
                        if (id != null) context.push('/products/$id');
                      } else if (url.startsWith('/explore')) {
                        context.push(url);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withOpacity(0.4),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Text(
                        'عرض المنتج / القسم',
                        style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

