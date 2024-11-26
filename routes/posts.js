const express = require('express');
const router = express.Router();
const { marked } = require('marked');
const readingTime = require('reading-time');
const prism = require('prismjs');
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

// 加载所有需要的语言
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-python');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-json');
require('prismjs/components/prism-markdown');
require('prismjs/components/prism-css');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-jsx');
require('prismjs/components/prism-tsx');
require('prismjs/components/prism-yaml');

// 配置 marked
marked.setOptions({
    highlight: function (code, lang) {
        if (prism.languages[lang]) {
            try {
                const highlighted = prism.highlight(code, prism.languages[lang], lang);
                return `<pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>`;
            } catch (err) {
                console.error('Prism highlight error:', err);
                return `<pre class="language-${lang}"><code class="language-${lang}">${code}</code></pre>`;
            }
        }
        return `<pre class="language-plaintext"><code class="language-plaintext">${code}</code></pre>`;
    },
    langPrefix: 'language-',
    gfm: true,
    breaks: true,
    pedantic: false,
    smartLists: true,
    smartypants: true
});

// 每页显示的文章数量
const POSTS_PER_PAGE = 5;

// 临时数据存储
let posts = [];

// 读取所有文章
async function getAllPosts() {
    const postsDirectory = path.join(process.cwd(), 'posts');
    const files = await fs.readdir(postsDirectory);
    
    posts = await Promise.all(
        files.filter(file => file.endsWith('.md')).map(async (file) => {
            const filePath = path.join(postsDirectory, file);
            const content = await fs.readFile(filePath, 'utf8');
            const { data, content: markdown } = matter(content);
            const htmlContent = marked(markdown);
            const stats = readingTime(markdown);
            
            // 生成目录
            const headings = [];
            const renderer = new marked.Renderer();
            renderer.heading = function(text, level) {
                const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
                headings.push({ text, level, id: slug });
                return `<h${level} id="${slug}">${text}</h${level}>`;
            };
            marked(markdown, { renderer });

            return {
                id: file.replace('.md', ''),
                title: data.title,
                date: new Date(data.date),
                category: data.category,
                tags: data.tags || [],
                excerpt: data.excerpt,
                content: markdown,
                htmlContent,
                readingTime: stats,
                toc: headings
            };
        })
    );

    // 按日期降序排序
    return posts.sort((a, b) => b.date - a.date);
}

// 为所有文章生成目录和阅读时间
async function generatePostMetadata() {
    for (const post of posts) {
        // 生成阅读时间
        post.readingTime = readingTime(post.content);
        
        // 生成目录
        const headings = [];
        const renderer = new marked.Renderer();
        
        renderer.heading = function(text, level) {
            const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
            const id = `heading-${escapedText}`;
            
            headings.push({
                id: id,
                text: text,
                level: level
            });
            
            return `<h${level} id="${id}">${text}</h${level}>`;
        };
        
        // 使用自定义渲染器转换 Markdown
        marked.setOptions({ renderer });
        post.htmlContent = marked(post.content);
        post.toc = headings;
    }
}

// 中间件：为所有路由添加默认的 currentCategory
router.use(async (req, res, next) => {
    await getAllPosts();
    await generatePostMetadata();
    
    // 设置当前分类
    if (req.path === '/about') {
        res.locals.currentCategory = 'about';
    } else {
        res.locals.currentCategory = req.query.category || 'all';
    }
    
    next();
});

// 首页 - 文章列表
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const tag = req.query.tag;
        const searchQuery = req.query.q;

        let filteredPosts = posts;

        // 按分类筛选
        if (req.query.category) {
            filteredPosts = filteredPosts.filter(post => post.category === req.query.category);
        }

        // 按标签筛选
        if (tag) {
            filteredPosts = filteredPosts.filter(post => post.tags.includes(tag));
        }

        // 搜索功能
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(query) ||
                post.content.toLowerCase().includes(query) ||
                post.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // 计算分页
        const totalPosts = filteredPosts.length;
        const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
        const startIndex = (page - 1) * POSTS_PER_PAGE;
        const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

        // 获取所有标签
        const allTags = [...new Set(posts.flatMap(post => post.tags))];

        res.render('posts/index', { 
            posts: paginatedPosts,
            currentCategory: req.query.category || 'all',
            currentTag: tag || '',
            searchQuery: searchQuery || '',
            allTags: allTags,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        res.status(500).send('Error loading posts');
    }
});

// 获取单篇文章
router.get('/post/:id', async (req, res) => {
    try {
        const post = posts.find(p => p.id === req.params.id);
        if (!post) {
            return res.status(404).render('error', { 
                error: '文章未找到',
                currentCategory: 'all'
            });
        }
        res.render('posts/show', { 
            post,
            currentCategory: post.category,
            allTags: [...new Set(posts.flatMap(post => post.tags))]
        });
    } catch (error) {
        console.error('Error loading post:', error);
        res.status(500).send('Error loading post');
    }
});

// 关于我页面
router.get('/about', (req, res) => {
    res.render('about', {
        currentCategory: 'about',
        allTags: [...new Set(posts.flatMap(post => post.tags))]
    });
});

module.exports = router;
