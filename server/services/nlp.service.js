/**
 * NLP Service - Natural Language Processing
 * Handles duplicate detection and text analysis
 */

class NLPService {
    /**
     * Calculate Jaccard similarity between two strings
     */
    jaccardSimilarity(str1, str2) {
        const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        if (union.size === 0) return 0;
        return intersection.size / union.size;
    }

    /**
     * Check for duplicate content
     */
    async checkDuplicate(title, existingTitles, threshold = 0.8) {
        const duplicates = [];

        for (const existing of existingTitles) {
            const similarity = this.jaccardSimilarity(title, existing.title);
            if (similarity >= threshold) {
                duplicates.push({
                    id: existing._id,
                    title: existing.title,
                    similarity: Math.round(similarity * 100)
                });
            }
        }

        return duplicates.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Extract keywords from text
     */
    extractKeywords(text, maxKeywords = 10) {
        if (!text) return [];

        // Remove common stop words
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'this', 'that', 'these',
            'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our'
        ]);

        // Tokenize and filter
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));

        // Count frequency
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        // Sort by frequency and return top keywords
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxKeywords)
            .map(([word]) => word);
    }

    /**
     * Suggest tags based on content
     */
    suggestTags(title, description) {
        const combined = `${title} ${description || ''}`;
        return this.extractKeywords(combined, 5);
    }

    /**
     * Calculate content quality score
     */
    calculateQualityScore(document) {
        let score = 0;

        // Title length (optimal: 10-100 chars)
        if (document.title) {
            const titleLen = document.title.length;
            if (titleLen >= 10 && titleLen <= 100) score += 20;
            else if (titleLen >= 5) score += 10;
        }

        // Description presence and length
        if (document.description) {
            const descLen = document.description.length;
            if (descLen >= 100) score += 25;
            else if (descLen >= 50) score += 15;
            else score += 5;
        }

        // Tags presence
        if (document.tags && document.tags.length > 0) {
            score += Math.min(document.tags.length * 5, 20);
        }

        // Metadata completeness
        if (document.metadata && document.metadata.length > 0) {
            score += Math.min(document.metadata.length * 5, 20);
        }

        // Has file attachment
        if (document.fileUrls && document.fileUrls.length > 0) {
            score += 15;
        }

        return Math.min(score, 100);
    }

    /**
     * Detect potential compliance issues
     */
    detectComplianceIssues(text) {
        const issues = [];
        const lowerText = text.toLowerCase();

        // Check for PII patterns
        const piiPatterns = [
            { pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, issue: 'Potential SSN detected' },
            { pattern: /\b\d{16}\b/, issue: 'Potential credit card number detected' },
            { pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, issue: 'Email address detected' }
        ];

        piiPatterns.forEach(({ pattern, issue }) => {
            if (pattern.test(text)) {
                issues.push({ type: 'PII', message: issue, severity: 'high' });
            }
        });

        // Check for sensitive keywords
        const sensitiveKeywords = ['confidential', 'secret', 'classified', 'internal only', 'private'];
        sensitiveKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                issues.push({
                    type: 'Sensitivity',
                    message: `Contains sensitive keyword: "${keyword}"`,
                    severity: 'medium'
                });
            }
        });

        return issues;
    }
}

module.exports = new NLPService();
