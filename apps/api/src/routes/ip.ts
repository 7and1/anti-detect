import { Hono } from 'hono';
import type { Env } from '../index';

export const ipRoutes = new Hono<{ Bindings: Env }>();

// GET /ip/check - Full IP analysis
ipRoutes.get('/check', async (c) => {
  const cf = c.req.raw.cf;
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const kv = c.env.IP_CACHE;

  // Check cache first
  const cacheKey = `ip:${ip}`;
  const cached = await kv.get(cacheKey, 'json');

  if (cached) {
    return c.json(cached);
  }

  // Extract Cloudflare data
  const cfData = {
    ip,
    country: cf?.country || 'unknown',
    countryCode: cf?.country || 'XX',
    region: cf?.region || 'unknown',
    city: cf?.city || 'unknown',
    postalCode: cf?.postalCode || 'unknown',
    latitude: cf?.latitude || 0,
    longitude: cf?.longitude || 0,
    timezone: cf?.timezone || 'unknown',
    asn: cf?.asn || 0,
    asOrganization: cf?.asOrganization || 'unknown',
    continent: cf?.continent || 'unknown',
    isEU: cf?.isEUCountry || false,
  };

  // Determine IP type
  const ipType = detectIpType(cfData.asOrganization, cfData.asn);

  // Check blacklists (now using real APIs)
  const blacklistStatus = await checkBlacklists(ip, c.env);

  // Get reverse DNS
  const reverseDns = await getReverseDNS(ip);

  // Get WHOIS data
  const whois = await getWHOIS(ip);

  // Enhanced risk calculation
  const riskScore = calculateAdvancedRiskScore(ipType, blacklistStatus, reverseDns, whois);

  const result = {
    ...cfData,
    ipType,
    isProxy: ipType === 'datacenter' || ipType === 'hosting',
    isVPN: ipType === 'vpn',
    isTor: ipType === 'tor',
    isResidential: ipType === 'residential' || ipType === 'isp',
    blacklistStatus,
    riskScore,
    reverseDns,
    whois,
    analysis: {
      httpProtocol: cf?.httpProtocol || 'unknown',
      tlsVersion: cf?.tlsVersion || 'unknown',
      tlsCipher: cf?.tlsCipher || 'unknown',
      botScore: (cf as any)?.botManagement?.score || null,
      verifiedBot: (cf as any)?.botManagement?.verifiedBot || false,
    },
    enhanced: {
      hostnameType: reverseDns.hostnameType,
      netType: detectNetworkType(whois, reverseDns),
      privacy: {
        hasStaticHostname: reverseDns.hostname && !reverseDns.hostname.includes('dynamic'),
        isDatacenter: reverseDns.hostnameType === 'datacenter',
        vpnRisk: reverseDns.hostnameType === 'vpn',
      },
    },
  };

  // Cache for 1 hour
  await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });

  return c.json(result);
});

// GET /ip/dns-leak - DNS leak test endpoints
ipRoutes.get('/dns-leak', async (c) => {
  // Generate unique test subdomain
  const testId = crypto.randomUUID().slice(0, 8);

  // In production, you'd set up actual DNS servers to receive these queries
  const testEndpoints = [
    `${testId}-1.dns.anti-detect.com`,
    `${testId}-2.dns.anti-detect.com`,
    `${testId}-3.dns.anti-detect.com`,
  ];

  return c.json({
    testId,
    endpoints: testEndpoints,
    instructions: [
      'Make DNS requests to each endpoint',
      'Our servers will record which DNS resolvers you use',
      'Results available at /ip/dns-leak/results/:testId',
    ],
    // For now, provide a basic check using the request's resolver
    currentResolver: {
      detected: c.req.header('CF-Connecting-IP') || 'unknown',
      // In production, this would be the actual DNS resolver IP
    },
  });
});

// GET /ip/dns-leak/results/:testId - Get DNS leak test results
ipRoutes.get('/dns-leak/results/:testId', async (c) => {
  const testId = c.req.param('testId');
  const kv = c.env.IP_CACHE;

  // Get cached results (in production, DNS servers would write these)
  const results = await kv.get(`dns:${testId}`, 'json');

  if (!results) {
    return c.json({
      testId,
      status: 'pending',
      message: 'Results not yet available. DNS queries may still be processing.',
    });
  }

  return c.json({
    testId,
    status: 'complete',
    results,
  });
});

// GET /ip/reverse-dns - Get reverse DNS lookup only
ipRoutes.get('/reverse-dns', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.query('ip') || 'unknown';

  if (ip === 'unknown') {
    return c.json({ error: 'IP address required' }, 400);
  }

  const kv = c.env.IP_CACHE;
  const cacheKey = `rdns:${ip}`;
  const cached = await kv.get(cacheKey, 'json');

  if (cached) {
    return c.json(cached);
  }

  const result = await getReverseDNS(ip);

  // Cache for 24 hours (DNS records are stable)
  await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 24 * 60 * 60 });

  return c.json(result);
});

// GET /ip/whois - Get WHOIS information only
ipRoutes.get('/whois', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.query('ip') || 'unknown';

  if (ip === 'unknown') {
    return c.json({ error: 'IP address required' }, 400);
  }

  const kv = c.env.IP_CACHE;
  const cacheKey = `whois:${ip}`;
  const cached = await kv.get(cacheKey, 'json');

  if (cached) {
    return c.json(cached);
  }

  const result = await getWHOIS(ip);

  // Cache for 7 days (WHOIS data changes slowly)
  await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 7 * 24 * 60 * 60 });

  return c.json(result);
});

// GET /ip/reputation - Get detailed reputation data
ipRoutes.get('/reputation', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.query('ip') || 'unknown';

  if (ip === 'unknown') {
    return c.json({ error: 'IP address required' }, 400);
  }

  const kv = c.env.IP_CACHE;
  const cacheKey = `reputation:${ip}`;
  const cached = await kv.get(cacheKey, 'json');

  if (cached) {
    return c.json(cached);
  }

  const blacklistStatus = await checkBlacklists(ip, c.env);
  const abuseConfidence = await getAbuseIPDBScore(ip);

  const result = {
    ip,
    blacklists: blacklistStatus,
    abuseIPDB: abuseConfidence,
    reputationScore: calculateReputationScore(blacklistStatus, abuseConfidence),
    recommendations: generateSecurityRecommendations(blacklistStatus, abuseConfidence),
    checkedAt: new Date().toISOString(),
  };

  // Cache for 1 hour (reputation data can change)
  await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 60 * 60 });

  return c.json(result);
});

// GET /ip/timezone-check - Check timezone consistency
ipRoutes.get('/timezone-check', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.query('ip') || 'unknown';
  const browserTimezone = c.req.query('browserTimezone');

  if (ip === 'unknown') {
    return c.json({ error: 'IP address required' }, 400);
  }

  const cf = c.req.raw.cf;
  const ipTimezone = cf?.timezone || 'unknown';

  const result = {
    ip,
    ipTimezone,
    browserTimezone: browserTimezone || 'unknown',
    match: browserTimezone && browserTimezone === ipTimezone,
    offsetMinutes: calculateTimezoneOffset(ipTimezone, browserTimezone),
    vpnLikelihood: browserTimezone && browserTimezone !== ipTimezone ? 'medium' : 'low',
    recommendations: generateTimezoneRecommendations(ipTimezone, browserTimezone),
  };

  return c.json(result);
});

// Helper functions
function detectIpType(asOrganization: string, asn: number): string {
  const org = asOrganization.toLowerCase();

  // Known datacenter/hosting providers
  const datacenters = [
    'amazon', 'aws', 'google', 'microsoft', 'azure', 'digitalocean',
    'linode', 'vultr', 'ovh', 'hetzner', 'cloudflare', 'akamai',
    'oracle', 'ibm cloud', 'alibaba', 'tencent',
  ];

  // Known VPN providers
  const vpns = [
    'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'privateinternetaccess',
    'protonvpn', 'mullvad', 'ipvanish',
  ];

  // Known ISPs
  const isps = [
    'comcast', 'at&t', 'verizon', 'spectrum', 'cox', 'frontier',
    'centurylink', 'virgin media', 'bt ', 'sky ', 'vodafone',
  ];

  // Check Tor
  if (org.includes('tor') || org.includes('exit node')) {
    return 'tor';
  }

  // Check VPN
  for (const vpn of vpns) {
    if (org.includes(vpn)) {
      return 'vpn';
    }
  }

  // Check datacenter
  for (const dc of datacenters) {
    if (org.includes(dc)) {
      return 'datacenter';
    }
  }

  // Check ISP (residential)
  for (const isp of isps) {
    if (org.includes(isp)) {
      return 'isp';
    }
  }

  // Check for hosting keywords
  if (org.includes('hosting') || org.includes('server') || org.includes('cloud')) {
    return 'hosting';
  }

  // Default to residential
  return 'residential';
}

async function checkBlacklists(ip: string, env?: Env): Promise<{
  listed: boolean;
  lists: Array<{
    name: string;
    reason?: string;
    listedDate?: string;
  }>;
}> {
  // Query AbuseIPDB for blacklist information
  try {
    const abuseKey = env?.ABUSEIPDB_KEY || process.env.ABUSEIPDB_KEY;
    if (!abuseKey) {
      console.log('No AbuseIPDB key configured, using mock data');
      return { listed: false, lists: [] };
    }

    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`, {
      headers: {
        'Key': abuseKey,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.log('AbuseIPDB API error:', response.status);
      return { listed: false, lists: [] };
    }

    const data = await response.json();
    const reports = data.data?.reports || [];

    return {
      listed: reports.length > 0,
      lists: reports.map((report: any) => ({
        name: 'AbuseIPDB',
        reason: report.comment || 'General abuse',
        listedDate: new Date(report.reportedAt).toISOString(),
      }))
    };
  } catch (error) {
    console.error('Blacklist check failed:', error);
    return { listed: false, lists: [] };
  }
}

// New enhanced helper functions

async function getReverseDNS(ip: string): Promise<{
  hostname: string | null;
  isValidHostname: boolean;
  hostnameType: 'residential' | 'datacenter' | 'vpn' | 'hosting' | 'unknown';
}> {
  try {
    // Reverse IP for PTR record lookup
    const octets = ip.split('.');
    if (octets.length !== 4) {
      return { hostname: null, isValidHostname: false, hostnameType: 'unknown' };
    }

    const reverseIp = `${octets[3]}.${octets[2]}.${octets[1]}.${octets[0]}`;
    const ptrQuery = `${reverseIp}.in-addr.arpa`;

    // Use Cloudflare DNS-over-HTTPS API (free and reliable)
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${ptrQuery}&type=PTR`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    if (!response.ok) {
      return { hostname: null, isValidHostname: false, hostnameType: 'unknown' };
    }

    const data = await response.json();
    const hostname = data.Answer?.[0]?.data || null;

    if (!hostname) {
      return { hostname: null, isValidHostname: false, hostnameType: 'unknown' };
    }

    return {
      hostname,
      isValidHostname: true,
      hostnameType: detectHostnameType(hostname),
    };
  } catch (error) {
    console.error('Reverse DNS lookup failed:', error);
    return { hostname: null, isValidHostname: false, hostnameType: 'unknown' };
  }
}

function detectHostnameType(hostname: string): 'residential' | 'datacenter' | 'vpn' | 'hosting' | 'unknown' {
  const host = hostname.toLowerCase();

  // Datacenter patterns
  const datacenterPatterns = [
    'ec2-', '.compute.amazonaws.com', '.aws.amazon.com',
    '.googleusercontent.com', '.google.com',
    '.azure.com', '.cloudapp.azure.com',
    '.digitalocean.com', '.vultr.com', '.linode.com',
    '.hetzner.com', '.ovh.net', '.scaleway.com',
    '.ibmcloud.com', '.alibabacloud.com', '.tencentcloudapi.com'
  ];

  // VPN patterns
  const vpnPatterns = [
    '.nordvpn.com', '.expressvpn.com', '.surfshark.com',
    '.cyberghost.com', '.pvpn.com', '.mullvad.net',
    '.ipvanish.com', '.protonvpn.com', '.windscribe.com'
  ];

  // Hosting patterns
  const hostingPatterns = [
    '.hosting', '.server', '.cloud', '.dedicated',
    '.colo', '.datacenter', '.facility'
  ];

  // Residential patterns (ISP hostnames)
  const residentialPatterns = [
    '.comcast.net', '.cable.comcast.com',
    '.att.net', '.sbcglobal.net',
    '.verizon.net', '.fios.verizon.net',
    '.charter.com', '.spectrum.com',
    '.cox.net', '.rr.com',
    '.btcentralplus.com', '.bt.net',
    '.virginmedia.com', '.sky.com',
    '.telia.net', '.telenor.no',
    '.telus.net', '.rogers.com',
    '.shaw.ca', '.bell.ca'
  ];

  // Check each type
  for (const pattern of datacenterPatterns) {
    if (host.includes(pattern)) return 'datacenter';
  }

  for (const pattern of vpnPatterns) {
    if (host.includes(pattern)) return 'vpn';
  }

  for (const pattern of hostingPatterns) {
    if (host.includes(pattern)) return 'hosting';
  }

  for (const pattern of residentialPatterns) {
    if (host.includes(pattern)) return 'residential';
  }

  // Check dynamic patterns
  if (host.includes('dynamic') || host.includes('dhcp') || host.includes('ppp')) {
    return 'residential';
  }

  return 'unknown';
}

async function getWHOIS(ip: string): Promise<{
  netname: string;
  orgName: string;
  registrar: string;
  country: string;
  cidr: string;
  netRange: {
    start: string;
    end: string;
  };
  abuseContact: string;
  registrationDate?: string;
  lastUpdated?: string;
}> {
  try {
    // Use ip-api.com for basic WHOIS-like data (free)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=16242`);

    if (!response.ok) {
      // Return minimal data if API fails
      return {
        netname: 'unknown',
        orgName: 'unknown',
        registrar: 'unknown',
        country: 'unknown',
        cidr: 'unknown',
        netRange: { start: 'unknown', end: 'unknown' },
        abuseContact: 'unknown',
      };
    }

    const data = await response.json();

    return {
      netname: data.as || 'unknown',
      orgName: data.org || data.isp || 'unknown',
      registrar: 'RIPE/ARIN/APNIC', // This would need specific API for actual registrar
      country: data.countryCode || 'unknown',
      cidr: `${data.query}/32`, // Simplified - would need actual CIDR lookup
      netRange: {
        start: data.query || 'unknown',
        end: data.query || 'unknown'
      },
      abuseContact: 'unknown', // Would need specific abuse contact lookup
      registrationDate: undefined,
      lastUpdated: undefined,
    };
  } catch (error) {
    console.error('WHOIS lookup failed:', error);
    return {
      netname: 'unknown',
      orgName: 'unknown',
      registrar: 'unknown',
      country: 'unknown',
      cidr: 'unknown',
      netRange: { start: 'unknown', end: 'unknown' },
      abuseContact: 'unknown',
    };
  }
}

function calculateAdvancedRiskScore(
  ipType: string,
  blacklistStatus: any,
  reverseDns: any,
  whois: any
): number {
  let score = 0;

  // IP type scoring (enhanced)
  switch (ipType) {
    case 'tor':
      score += 90;
      break;
    case 'datacenter':
    case 'hosting':
      score += 70;
      // Extra penalty for datacenter with no hostname
      if (reverseDns.hostnameType === 'datacenter') score += 10;
      break;
    case 'vpn':
      score += 50;
      break;
    case 'isp':
      score += 10;
      break;
    case 'residential':
      score += 0;
      break;
    default:
      score += 30;
  }

  // Blacklist scoring
  if (blacklistStatus.listed) {
    score += Math.min(blacklistStatus.lists.length * 15, 40);
  }

  // Reverse DNS scoring
  if (reverseDns.hostname) {
    if (reverseDns.hostnameType === 'vpn') {
      score += 20;
    } else if (reverseDns.hostnameType === 'datacenter') {
      score += 15;
    } else if (reverseDns.hostnameType === 'residential') {
      score -= 5; // Lower risk for residential hostnames
    }
  } else {
    score += 10; // Higher risk for missing hostname
  }

  // WHOIS scoring
  if (whois.orgName && whois.orgName.toLowerCase().includes('hosting')) {
    score += 10;
  }

  return Math.min(Math.max(score, 0), 100);
}

function detectNetworkType(whois: any, reverseDns: any): {
  category: 'residential' | 'business' | 'datacenter' | 'vpn' | 'mobile' | 'unknown';
  confidence: number;
  details: string[];
} {
  const details: string[] = [];
  let score = 0;
  let category: any = 'unknown';

  // Check reverse DNS
  if (reverseDns.hostname) {
    if (reverseDns.hostnameType === 'residential') {
      category = 'residential';
      score += 40;
      details.push('Residential hostname pattern detected');
    } else if (reverseDns.hostnameType === 'datacenter') {
      category = 'datacenter';
      score += 80;
      details.push('Datacenter hostname pattern detected');
    } else if (reverseDns.hostnameType === 'vpn') {
      category = 'vpn';
      score += 85;
      details.push('VPN provider hostname detected');
    }
  }

  // Check WHOIS organization
  if (whois.orgName) {
    const org = whois.orgName.toLowerCase();
    if (org.includes('mobile') || org.includes('wireless') || org.includes('cellular')) {
      if (category === 'unknown') category = 'mobile';
      score += 50;
      details.push('Mobile ISP detected');
    }
  }

  return {
    category,
    confidence: Math.min(score, 100),
    details,
  };
}

async function getAbuseIPDBScore(ip: string): Promise<{
  abuseConfidenceScore: number;
  totalReports: number;
  lastReported: string | null;
  countryUsage: string;
}> {
  try {
    const abuseKey = process.env.ABUSEIPDB_KEY;
    if (!abuseKey) {
      return {
        abuseConfidenceScore: 0,
        totalReports: 0,
        lastReported: null,
        countryUsage: 'unknown',
      };
    }

    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
      headers: {
        'Key': abuseKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        abuseConfidenceScore: 0,
        totalReports: 0,
        lastReported: null,
        countryUsage: 'unknown',
      };
    }

    const data = await response.json();
    const reportData = data.data;

    return {
      abuseConfidenceScore: reportData?.abuseConfidenceScore || 0,
      totalReports: reportData?.totalReports || 0,
      lastReported: reportData?.lastReportedAt || null,
      countryUsage: reportData?.countryCode || 'unknown',
    };
  } catch (error) {
    console.error('AbuseIPDB score fetch failed:', error);
    return {
      abuseConfidenceScore: 0,
      totalReports: 0,
      lastReported: null,
      countryUsage: 'unknown',
    };
  }
}

function calculateReputationScore(blacklistStatus: any, abuseIPDB: any): number {
  let score = 100;

  // Deductions for blacklists
  if (blacklistStatus.listed) {
    score -= blacklistStatus.lists.length * 25;
  }

  // Deductions for abuse confidence
  score -= abuseIPDB.abuseConfidenceScore;

  // Deductions for report volume
  if (abuseIPDB.totalReports > 0) {
    score -= Math.min(abuseIPDB.totalReports * 5, 50);
  }

  return Math.max(score, 0);
}

function generateSecurityRecommendations(blacklistStatus: any, abuseIPDB: any): string[] {
  const recommendations: string[] = [];

  if (blacklistStatus.listed) {
    recommendations.push('⚠️ Your IP appears on blacklist(s). Consider using a VPN or proxy.');
    recommendations.push('📧 Contact the blacklist providers if you believe this is an error.');
  }

  if (abuseIPDB.abuseConfidenceScore > 25) {
    recommendations.push('🔒 High abuse confidence detected. Avoid sending emails from this IP.');
  }

  if (abuseIPDB.totalReports > 5) {
    recommendations.push('🚨 Multiple abuse reports. Use a different IP for legitimate activities.');
  }

  if (!blacklistStatus.listed && abuseIPDB.abuseConfidenceScore === 0) {
    recommendations.push('✅ Your IP has a clean reputation. Good for all activities.');
  }

  return recommendations;
}

function calculateTimezoneOffset(ipTimezone: string, browserTimezone?: string): number {
  if (!browserTimezone || browserTimezone === 'unknown' || ipTimezone === 'unknown') {
    return 0;
  }

  // Simple timezone comparison (in production, use more accurate timezone parsing)
  const ipOffset = getTimezoneOffset(ipTimezone);
  const browserOffset = getTimezoneOffset(browserTimezone);

  return Math.abs(ipOffset - browserOffset);
}

function getTimezoneOffset(timezone: string): number {
  // Simplified timezone offset calculation
  // In production, use a proper timezone library like timezonecomplete
  const offsets: { [key: string]: number } = {
    'UTC': 0,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Asia/Shanghai': 8,
    'Asia/Tokyo': 9,
    'Australia/Sydney': 11,
  };

  return offsets[timezone] || 0;
}

function generateTimezoneRecommendations(ipTimezone: string, browserTimezone?: string): string[] {
  const recommendations: string[] = [];

  if (!browserTimezone || browserTimezone === 'unknown') {
    recommendations.push('ℹ️ Browser timezone not provided for comparison.');
    return recommendations;
  }

  if (ipTimezone === browserTimezone) {
    recommendations.push('✅ Timezone consistency detected - no VPN indicator here.');
  } else {
    recommendations.push('⚠️ Timezone mismatch detected - possible VPN or proxy usage.');
    recommendations.push(`🌍 IP location: ${ipTimezone}, Browser: ${browserTimezone}`);

    const offset = calculateTimezoneOffset(ipTimezone, browserTimezone);
    if (offset > 4) {
      recommendations.push('🚨 Large timezone difference (>4 hours) - high VPN probability.');
    } else if (offset > 1) {
      recommendations.push('⚡ Moderate timezone difference - possible proxy.');
    }
  }

  return recommendations;
}
